;; ============================================================================
;; PredictStack - Peer-to-Peer Prediction Market Platform
;; ============================================================================
;; A decentralized prediction market platform on Stacks blockchain
;; Users can bet on binary outcomes (YES/NO) using USDCx tokens
;; All funds are held in escrow and distributed to winners after resolution
;; ============================================================================

;; ============================================================================
;; TRAITS
;; ============================================================================

;; Use local SIP-010 trait definition
(use-trait sip010-trait .sip010-trait.sip010-trait)

;; ============================================================================
;; CONSTANTS - ERROR CODES
;; ============================================================================

(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-MARKET-NOT-FOUND (err u101))
(define-constant ERR-MARKET-RESOLVED (err u102))
(define-constant ERR-MARKET-NOT-RESOLVED (err u103))
(define-constant ERR-INVALID-OUTCOME (err u104))
(define-constant ERR-INSUFFICIENT-BALANCE (err u105))
(define-constant ERR-ALREADY-CLAIMED (err u106))
(define-constant ERR-NO-POSITION (err u107))
(define-constant ERR-WRONG-OUTCOME (err u108))
(define-constant ERR-PLATFORM-PAUSED (err u109))
(define-constant ERR-INVALID-AMOUNT (err u110))
(define-constant ERR-DEADLINE-PASSED (err u111))
(define-constant ERR-DEADLINE-NOT-PASSED (err u112))
(define-constant ERR-MARKET-CANCELLED (err u113))
(define-constant ERR-MARKET-NOT-CANCELLED (err u114))
(define-constant ERR-ALREADY-INITIALIZED (err u115))
(define-constant ERR-NOT-INITIALIZED (err u116))
(define-constant ERR-INVALID-QUESTION (err u117))
(define-constant ERR-TRANSFER-FAILED (err u118))
(define-constant ERR-ZERO-POOL (err u119))
(define-constant ERR-MARKET-ACTIVE (err u120))

;; ============================================================================
;; CONSTANTS - PLATFORM DEFAULTS
;; ============================================================================

;; Maximum values for safety
(define-constant MAX-FEE-BPS u1000) ;; Max 10% fee
(define-constant BPS-DENOMINATOR u10000)

;; Market statuses (stored as uint for efficiency)
(define-constant STATUS-ACTIVE u0)
(define-constant STATUS-RESOLVED u1) 
(define-constant STATUS-CANCELLED u2)

;; ============================================================================
;; DATA VARIABLES
;; ============================================================================

;; Contract initialization state
(define-data-var contract-initialized bool false)

;; Auto-incrementing market ID counter
(define-data-var next-market-id uint u1)

;; Platform configuration
(define-data-var platform-admin principal tx-sender)
(define-data-var platform-oracle principal tx-sender)
(define-data-var platform-fee-bps uint u200) ;; 2% default fee
(define-data-var min-bet-amount uint u1000000) ;; 1 USDCx (6 decimals)
(define-data-var platform-treasury principal tx-sender)
(define-data-var platform-paused bool false)

;; Platform statistics
(define-data-var total-markets-created uint u0)
(define-data-var total-volume uint u0)
(define-data-var total-fees-collected uint u0)

;; ============================================================================
;; DATA MAPS
;; ============================================================================

;; Main market data structure
(define-map markets
  { market-id: uint }
  {
    question: (string-ascii 256),
    description: (optional (string-ascii 512)),
    creator: principal,
    created-at: uint,
    resolve-date: uint,
    yes-pool: uint,
    no-pool: uint,
    total-bets: uint,
    status: uint,
    winning-outcome: (optional bool),
    resolved-at: (optional uint),
    external-id: (optional (string-ascii 128)),
    category: (string-ascii 32),
    image-url: (optional (string-ascii 256))
  }
)

;; User positions in markets
;; Composite key: {user, market-id}
(define-map user-positions
  { user: principal, market-id: uint }
  {
    yes-amount: uint,
    no-amount: uint,
    total-placed-at: uint,
    claimed: bool
  }
)

;; Track which markets a user has participated in
(define-map user-market-list
  { user: principal }
  { market-ids: (list 100 uint) }
)

;; ============================================================================
;; PRIVATE HELPER FUNCTIONS
;; ============================================================================

;; Check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get platform-admin))
)

;; Check if caller is oracle
(define-private (is-oracle)
  (is-eq tx-sender (var-get platform-oracle))
)

;; Check if caller is admin or oracle
(define-private (is-admin-or-oracle)
  (or (is-admin) (is-oracle))
)

;; Check if platform is operational (not paused)
(define-private (is-platform-active)
  (not (var-get platform-paused))
)

;; Get market status as string for readability
(define-private (status-to-string (status uint))
  (if (is-eq status STATUS-ACTIVE)
    "active"
    (if (is-eq status STATUS-RESOLVED)
      "resolved"
      "cancelled"
    )
  )
)

;; Safe multiplication to prevent overflow
;; Returns (a * b) / c with overflow protection
(define-private (safe-mul-div (a uint) (b uint) (c uint))
  (if (is-eq c u0)
    u0
    (/ (* a b) c)
  )
)

;; Add market to user's list of participated markets
(define-private (add-market-to-user-list (user principal) (market-id uint))
  (let
    (
      (current-list (default-to { market-ids: (list ) } (map-get? user-market-list { user: user })))
      (existing-markets (get market-ids current-list))
    )
    ;; Only add if not already in list and list is not full
    (if (is-some (index-of existing-markets market-id))
      true ;; Already in list
      (match (as-max-len? (append existing-markets market-id) u100)
        success (begin
          (map-set user-market-list { user: user } { market-ids: success })
          true
        )
        false ;; List is full, but we continue anyway
      )
    )
  )
)

;; ============================================================================
;; ADMINISTRATIVE FUNCTIONS
;; ============================================================================

;; Initialize the contract with platform settings
;; Can only be called once
(define-public (initialize 
  (admin principal)
  (oracle principal)
  (treasury principal)
  (fee-bps uint)
  (min-bet uint)
)
  (begin
    ;; Ensure not already initialized
    (asserts! (not (var-get contract-initialized)) ERR-ALREADY-INITIALIZED)
    
    ;; Validate fee is within acceptable range
    (asserts! (<= fee-bps MAX-FEE-BPS) ERR-INVALID-AMOUNT)
    
    ;; Validate min bet is reasonable (at least 1 token with 6 decimals)
    (asserts! (>= min-bet u1000000) ERR-INVALID-AMOUNT)
    
    ;; Set platform configuration
    (var-set platform-admin admin)
    (var-set platform-oracle oracle)
    (var-set platform-treasury treasury)
    (var-set platform-fee-bps fee-bps)
    (var-set min-bet-amount min-bet)
    (var-set contract-initialized true)
    
    ;; Emit initialization event
    (print {
      event: "platform-initialized",
      admin: admin,
      oracle: oracle,
      treasury: treasury,
      fee-bps: fee-bps,
      min-bet: min-bet,
      block-height: block-height
    })
    
    (ok true)
  )
)

;; Update platform fee (admin only)
(define-public (set-platform-fee (new-fee-bps uint))
  (begin
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (asserts! (<= new-fee-bps MAX-FEE-BPS) ERR-INVALID-AMOUNT)
    
    (let ((old-fee (var-get platform-fee-bps)))
      (var-set platform-fee-bps new-fee-bps)
      
      (print {
        event: "fee-updated",
        old-fee: old-fee,
        new-fee: new-fee-bps,
        updated-by: tx-sender,
        block-height: block-height
      })
    )
    
    (ok true)
  )
)

;; Update oracle address (admin only)
(define-public (set-oracle (new-oracle principal))
  (begin
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    
    (let ((old-oracle (var-get platform-oracle)))
      (var-set platform-oracle new-oracle)
      
      (print {
        event: "oracle-updated",
        old-oracle: old-oracle,
        new-oracle: new-oracle,
        updated-by: tx-sender,
        block-height: block-height
      })
    )
    
    (ok true)
  )
)

;; Update admin address (admin only)
(define-public (set-admin (new-admin principal))
  (begin
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    
    (let ((old-admin (var-get platform-admin)))
      (var-set platform-admin new-admin)
      
      (print {
        event: "admin-updated",
        old-admin: old-admin,
        new-admin: new-admin,
        updated-by: tx-sender,
        block-height: block-height
      })
    )
    
    (ok true)
  )
)

;; Update treasury address (admin only)
(define-public (set-treasury (new-treasury principal))
  (begin
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    
    (var-set platform-treasury new-treasury)
    
    (print {
      event: "treasury-updated",
      new-treasury: new-treasury,
      updated-by: tx-sender,
      block-height: block-height
    })
    
    (ok true)
  )
)

;; Update minimum bet amount (admin only)
(define-public (set-min-bet-amount (new-min-bet uint))
  (begin
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (asserts! (>= new-min-bet u1000000) ERR-INVALID-AMOUNT)
    
    (var-set min-bet-amount new-min-bet)
    
    (print {
      event: "min-bet-updated",
      new-min-bet: new-min-bet,
      updated-by: tx-sender,
      block-height: block-height
    })
    
    (ok true)
  )
)

;; Pause platform (admin only, emergency)
(define-public (pause-platform)
  (begin
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    
    (var-set platform-paused true)
    
    (print {
      event: "platform-paused",
      paused-by: tx-sender,
      block-height: block-height
    })
    
    (ok true)
  )
)

;; Unpause platform (admin only)
(define-public (unpause-platform)
  (begin
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    
    (var-set platform-paused false)
    
    (print {
      event: "platform-unpaused",
      unpaused-by: tx-sender,
      block-height: block-height
    })
    
    (ok true)
  )
)

;; ============================================================================
;; MARKET MANAGEMENT FUNCTIONS
;; ============================================================================

;; Create a new prediction market (admin/oracle only)
(define-public (create-market 
  (question (string-ascii 256))
  (description (optional (string-ascii 512)))
  (resolve-date uint)
  (external-id (optional (string-ascii 128)))
  (category (string-ascii 32))
  (image-url (optional (string-ascii 256)))
  (token-contract <sip010-trait>)
)
  (let
    (
      (market-id (var-get next-market-id))
    )
    ;; Validations
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-platform-active) ERR-PLATFORM-PAUSED)
    (asserts! (is-admin-or-oracle) ERR-NOT-AUTHORIZED)
    (asserts! (> (len question) u0) ERR-INVALID-QUESTION)
    (asserts! (> resolve-date block-height) ERR-DEADLINE-PASSED)
    
    ;; Create the market
    (map-set markets
      { market-id: market-id }
      {
        question: question,
        description: description,
        creator: tx-sender,
        created-at: block-height,
        resolve-date: resolve-date,
        yes-pool: u0,
        no-pool: u0,
        total-bets: u0,
        status: STATUS-ACTIVE,
        winning-outcome: none,
        resolved-at: none,
        external-id: external-id,
        category: category,
        image-url: image-url
      }
    )
    
    ;; Increment counters
    (var-set next-market-id (+ market-id u1))
    (var-set total-markets-created (+ (var-get total-markets-created) u1))
    
    ;; Emit event
    (print {
      event: "market-created",
      market-id: market-id,
      question: question,
      creator: tx-sender,
      resolve-date: resolve-date,
      external-id: external-id,
      category: category,
      image-url: image-url,
      block-height: block-height
    })
    
    (ok market-id)
  )
)

;; Resolve a market with the winning outcome (oracle only)
(define-public (resolve-market 
  (market-id uint) 
  (winning-outcome bool)
  (token-contract <sip010-trait>)
)
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) ERR-MARKET-NOT-FOUND))
    )
    ;; Validations
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-oracle) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status market) STATUS-ACTIVE) ERR-MARKET-RESOLVED)
    (asserts! (>= block-height (get resolve-date market)) ERR-DEADLINE-NOT-PASSED)
    
    ;; Update market status
    (map-set markets
      { market-id: market-id }
      (merge market {
        status: STATUS-RESOLVED,
        winning-outcome: (some winning-outcome),
        resolved-at: (some block-height)
      })
    )
    
    ;; Emit event
    (print {
      event: "market-resolved",
      market-id: market-id,
      winning-outcome: winning-outcome,
      yes-pool: (get yes-pool market),
      no-pool: (get no-pool market),
      resolved-by: tx-sender,
      block-height: block-height
    })
    
    (ok true)
  )
)

;; Cancel a market and enable refunds (admin only, emergency)
(define-public (cancel-market 
  (market-id uint)
  (token-contract <sip010-trait>)
)
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) ERR-MARKET-NOT-FOUND))
    )
    ;; Validations
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-admin) ERR-NOT-AUTHORIZED)
    (asserts! (is-eq (get status market) STATUS-ACTIVE) ERR-MARKET-RESOLVED)
    
    ;; Update market status
    (map-set markets
      { market-id: market-id }
      (merge market {
        status: STATUS-CANCELLED,
        resolved-at: (some block-height)
      })
    )
    
    ;; Emit event
    (print {
      event: "market-cancelled",
      market-id: market-id,
      yes-pool: (get yes-pool market),
      no-pool: (get no-pool market),
      cancelled-by: tx-sender,
      block-height: block-height
    })
    
    (ok true)
  )
)

;; ============================================================================
;; BETTING FUNCTIONS
;; ============================================================================

;; Place a bet on a market outcome
(define-public (place-bet 
  (market-id uint) 
  (outcome bool) 
  (amount uint)
  (token-contract <sip010-trait>)
)
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) ERR-MARKET-NOT-FOUND))
      (existing-position (default-to 
        { yes-amount: u0, no-amount: u0, total-placed-at: block-height, claimed: false }
        (map-get? user-positions { user: tx-sender, market-id: market-id })
      ))
    )
    ;; Validations
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-platform-active) ERR-PLATFORM-PAUSED)
    (asserts! (is-eq (get status market) STATUS-ACTIVE) ERR-MARKET-RESOLVED)
    (asserts! (< block-height (get resolve-date market)) ERR-DEADLINE-PASSED)
    (asserts! (>= amount (var-get min-bet-amount)) ERR-INVALID-AMOUNT)
    
    ;; Transfer tokens from user to contract
    (try! (contract-call? token-contract transfer amount tx-sender (as-contract tx-sender) none))
    
    ;; Update user position
    (map-set user-positions
      { user: tx-sender, market-id: market-id }
      {
        yes-amount: (if outcome (+ (get yes-amount existing-position) amount) (get yes-amount existing-position)),
        no-amount: (if outcome (get no-amount existing-position) (+ (get no-amount existing-position) amount)),
        total-placed-at: block-height,
        claimed: false
      }
    )
    
    ;; Update market pools
    (map-set markets
      { market-id: market-id }
      (merge market {
        yes-pool: (if outcome (+ (get yes-pool market) amount) (get yes-pool market)),
        no-pool: (if outcome (get no-pool market) (+ (get no-pool market) amount)),
        total-bets: (+ (get total-bets market) u1)
      })
    )
    
    ;; Add to user's market list
    (add-market-to-user-list tx-sender market-id)
    
    ;; Update platform volume
    (var-set total-volume (+ (var-get total-volume) amount))
    
    ;; Emit event
    (print {
      event: "bet-placed",
      market-id: market-id,
      user: tx-sender,
      outcome: outcome,
      amount: amount,
      new-yes-pool: (if outcome (+ (get yes-pool market) amount) (get yes-pool market)),
      new-no-pool: (if outcome (get no-pool market) (+ (get no-pool market) amount)),
      block-height: block-height
    })
    
    (ok true)
  )
)

;; ============================================================================
;; PAYOUT FUNCTIONS
;; ============================================================================

;; Claim winnings after market resolution
(define-public (claim-winnings 
  (market-id uint)
  (token-contract <sip010-trait>)
)
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) ERR-MARKET-NOT-FOUND))
      (position (unwrap! (map-get? user-positions { user: tx-sender, market-id: market-id }) ERR-NO-POSITION))
      (winning-outcome (unwrap! (get winning-outcome market) ERR-MARKET-NOT-RESOLVED))
    )
    ;; Validations
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-eq (get status market) STATUS-RESOLVED) ERR-MARKET-NOT-RESOLVED)
    (asserts! (not (get claimed position)) ERR-ALREADY-CLAIMED)
    
    (let
      (
        ;; Capture user address outside as-contract context
        (claimer tx-sender)
        ;; Get user's stake on winning side
        (user-winning-stake (if winning-outcome 
          (get yes-amount position) 
          (get no-amount position)))
        (winning-pool (if winning-outcome (get yes-pool market) (get no-pool market)))
        (losing-pool (if winning-outcome (get no-pool market) (get yes-pool market)))
      )
      ;; User must have bet on winning side
      (asserts! (> user-winning-stake u0) ERR-WRONG-OUTCOME)
      
      ;; Prevent division by zero
      (asserts! (> winning-pool u0) ERR-ZERO-POOL)
      
      (let
        (
          ;; Calculate winnings:
          ;; user-share = (user-bet / winning-pool) * losing-pool
          (user-share (safe-mul-div user-winning-stake losing-pool winning-pool))
          
          ;; Calculate platform fee on the profit only
          (platform-fee (safe-mul-div user-share (var-get platform-fee-bps) BPS-DENOMINATOR))
          
          ;; Net winnings after fee
          (net-winnings (- user-share platform-fee))
          
          ;; Total payout = original stake + net winnings
          (total-payout (+ user-winning-stake net-winnings))
        )
        ;; Mark position as claimed BEFORE transfers (checks-effects-interactions pattern)
        (map-set user-positions
          { user: tx-sender, market-id: market-id }
          (merge position { claimed: true })
        )
        
        ;; Update total fees collected
        (var-set total-fees-collected (+ (var-get total-fees-collected) platform-fee))
        
        ;; Transfer winnings to user
        (try! (as-contract (contract-call? token-contract transfer total-payout tx-sender claimer none)))
        
        ;; Transfer platform fee to treasury
        (if (> platform-fee u0)
          (try! (as-contract (contract-call? token-contract transfer platform-fee tx-sender (var-get platform-treasury) none)))
          true
        )
        
        ;; Emit event
        (print {
          event: "winnings-claimed",
          market-id: market-id,
          user: tx-sender,
          winning-stake: user-winning-stake,
          profit-share: user-share,
          platform-fee: platform-fee,
          net-winnings: net-winnings,
          total-payout: total-payout,
          block-height: block-height
        })
        
        (ok total-payout)
      )
    )
  )
)

;; Claim refund if market was cancelled
(define-public (claim-refund 
  (market-id uint)
  (token-contract <sip010-trait>)
)
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) ERR-MARKET-NOT-FOUND))
      (position (unwrap! (map-get? user-positions { user: tx-sender, market-id: market-id }) ERR-NO-POSITION))
      (claimer tx-sender)
    )
    ;; Validations
    (asserts! (var-get contract-initialized) ERR-NOT-INITIALIZED)
    (asserts! (is-eq (get status market) STATUS-CANCELLED) ERR-MARKET-NOT-CANCELLED)
    (asserts! (not (get claimed position)) ERR-ALREADY-CLAIMED)
    
    (let
      (
        ;; Total refund = YES stake + NO stake
        (total-refund (+ (get yes-amount position) (get no-amount position)))
      )
      ;; Must have some stake to refund
      (asserts! (> total-refund u0) ERR-NO-POSITION)
      
      ;; Mark position as claimed BEFORE transfer
      (map-set user-positions
        { user: tx-sender, market-id: market-id }
        (merge position { claimed: true })
      )
      
      ;; Transfer refund to user
      (try! (as-contract (contract-call? token-contract transfer total-refund tx-sender claimer none)))
      
      ;; Emit event
      (print {
        event: "refund-claimed",
        market-id: market-id,
        user: tx-sender,
        refund-amount: total-refund,
        block-height: block-height
      })
      
      (ok total-refund)
    )
  )
)

;; ============================================================================
;; READ-ONLY FUNCTIONS
;; ============================================================================

;; Get market details by ID
(define-read-only (get-market (market-id uint))
  (match (map-get? markets { market-id: market-id })
    market (ok {
      market-id: market-id,
      question: (get question market),
      description: (get description market),
      creator: (get creator market),
      created-at: (get created-at market),
      resolve-date: (get resolve-date market),
      yes-pool: (get yes-pool market),
      no-pool: (get no-pool market),
      total-bets: (get total-bets market),
      status: (status-to-string (get status market)),
      winning-outcome: (get winning-outcome market),
      resolved-at: (get resolved-at market),
      category: (get category market),
      image-url: (get image-url market)
    })
    ERR-MARKET-NOT-FOUND
  )
)

;; Get user's position in a market
(define-read-only (get-user-position (user principal) (market-id uint))
  (match (map-get? user-positions { user: user, market-id: market-id })
    position (ok {
      user: user,
      market-id: market-id,
      yes-amount: (get yes-amount position),
      no-amount: (get no-amount position),
      total-amount: (+ (get yes-amount position) (get no-amount position)),
      placed-at: (get total-placed-at position),
      claimed: (get claimed position)
    })
    ERR-NO-POSITION
  )
)

;; Calculate current odds for YES outcome
;; Returns odds as a tuple with numerator/denominator for precision
(define-read-only (get-current-odds (market-id uint))
  (match (map-get? markets { market-id: market-id })
    market (let
      (
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (total-pool (+ yes-pool no-pool))
      )
      (if (is-eq total-pool u0)
        (ok { 
          yes-odds-numerator: u50, 
          yes-odds-denominator: u100,
          no-odds-numerator: u50,
          no-odds-denominator: u100,
          yes-pool: yes-pool,
          no-pool: no-pool
        })
        (ok { 
          yes-odds-numerator: (* yes-pool u100),
          yes-odds-denominator: total-pool,
          no-odds-numerator: (* no-pool u100),
          no-odds-denominator: total-pool,
          yes-pool: yes-pool,
          no-pool: no-pool
        })
      )
    )
    ERR-MARKET-NOT-FOUND
  )
)

;; Calculate potential payout for a hypothetical bet
;; Shows what winnings would be if outcome wins (before fees)
(define-read-only (calculate-potential-payout 
  (market-id uint) 
  (outcome bool) 
  (bet-amount uint)
)
  (match (map-get? markets { market-id: market-id })
    market (let
      (
        ;; Current pools
        (current-yes-pool (get yes-pool market))
        (current-no-pool (get no-pool market))
        
        ;; New pools after this bet
        (new-yes-pool (if outcome (+ current-yes-pool bet-amount) current-yes-pool))
        (new-no-pool (if outcome current-no-pool (+ current-no-pool bet-amount)))
        
        ;; If this outcome wins
        (winning-pool (if outcome new-yes-pool new-no-pool))
        (losing-pool (if outcome new-no-pool new-yes-pool))
        
        ;; User's share of losing pool
        (user-share (if (> winning-pool u0) 
          (safe-mul-div bet-amount losing-pool winning-pool)
          u0
        ))
        
        ;; Platform fee
        (platform-fee (safe-mul-div user-share (var-get platform-fee-bps) BPS-DENOMINATOR))
        
        ;; Net profit
        (net-profit (- user-share platform-fee))
        
        ;; Total payout if wins
        (total-payout (+ bet-amount net-profit))
        
        ;; ROI calculation (as percentage * 100 for precision)
        (roi-basis-points (if (> bet-amount u0)
          (safe-mul-div net-profit u10000 bet-amount)
          u0
        ))
      )
      (ok {
        bet-amount: bet-amount,
        outcome: outcome,
        potential-profit: net-profit,
        potential-payout: total-payout,
        platform-fee: platform-fee,
        roi-basis-points: roi-basis-points,
        current-yes-pool: current-yes-pool,
        current-no-pool: current-no-pool
      })
    )
    ERR-MARKET-NOT-FOUND
  )
)

;; Get platform statistics
(define-read-only (get-platform-stats)
  (ok {
    total-markets: (var-get total-markets-created),
    total-volume: (var-get total-volume),
    total-fees-collected: (var-get total-fees-collected),
    platform-fee-bps: (var-get platform-fee-bps),
    min-bet-amount: (var-get min-bet-amount),
    platform-paused: (var-get platform-paused),
    admin: (var-get platform-admin),
    oracle: (var-get platform-oracle),
    treasury: (var-get platform-treasury)
  })
)

;; Get market statistics
(define-read-only (get-market-stats (market-id uint))
  (match (map-get? markets { market-id: market-id })
    market (let
      (
        (yes-pool (get yes-pool market))
        (no-pool (get no-pool market))
        (total-pool (+ yes-pool no-pool))
      )
      (ok {
        market-id: market-id,
        yes-pool: yes-pool,
        no-pool: no-pool,
        total-pool: total-pool,
        total-bets: (get total-bets market),
        status: (status-to-string (get status market)),
        blocks-until-resolution: (if (> (get resolve-date market) block-height)
          (- (get resolve-date market) block-height)
          u0
        )
      })
    )
    ERR-MARKET-NOT-FOUND
  )
)

;; Get list of markets a user has bet on
(define-read-only (get-user-markets (user principal))
  (match (map-get? user-market-list { user: user })
    user-list (ok (get market-ids user-list))
    (ok (list ))
  )
)

;; Get platform configuration
(define-read-only (get-platform-config)
  (ok {
    admin: (var-get platform-admin),
    oracle: (var-get platform-oracle),
    treasury: (var-get platform-treasury),
    fee-bps: (var-get platform-fee-bps),
    min-bet-amount: (var-get min-bet-amount),
    paused: (var-get platform-paused),
    initialized: (var-get contract-initialized)
  })
)

;; Check if a user can claim winnings for a market
(define-read-only (can-claim-winnings (user principal) (market-id uint))
  (match (map-get? markets { market-id: market-id })
    market (match (map-get? user-positions { user: user, market-id: market-id })
      position (let
        (
          (winning-outcome (get winning-outcome market))
        )
        (if (not (is-eq (get status market) STATUS-RESOLVED))
          (ok { can-claim: false, reason: "market-not-resolved" })
          (if (get claimed position)
            (ok { can-claim: false, reason: "already-claimed" })
            (match winning-outcome
              outcome (let
                (
                  (user-winning-stake (if outcome 
                    (get yes-amount position) 
                    (get no-amount position)))
                )
                (if (> user-winning-stake u0)
                  (ok { can-claim: true, reason: "eligible" })
                  (ok { can-claim: false, reason: "wrong-outcome" })
                )
              )
              (ok { can-claim: false, reason: "no-winning-outcome" })
            )
          )
        )
      )
      (ok { can-claim: false, reason: "no-position" })
    )
    (ok { can-claim: false, reason: "market-not-found" })
  )
)

;; Calculate total claimable winnings for a user across all resolved markets
(define-read-only (get-user-claimable-summary (user principal))
  ;; Note: This is a simplified version. For a complete implementation,
  ;; you would need to iterate through all user markets.
  ;; This returns the list of market IDs the user can then query individually.
  (match (map-get? user-market-list { user: user })
    user-list (ok {
      user: user,
      market-ids: (get market-ids user-list),
      note: "Query each market-id with get-user-position and can-claim-winnings for details"
    })
    (ok {
      user: user,
      market-ids: (list ),
      note: "No positions found"
    })
  )
)

;; Get next market ID (useful for frontend)
(define-read-only (get-next-market-id)
  (ok (var-get next-market-id))
)

;; Check if platform is initialized
(define-read-only (is-initialized)
  (ok (var-get contract-initialized))
)

;; Check if address is admin
(define-read-only (is-address-admin (address principal))
  (ok (is-eq address (var-get platform-admin)))
)

;; Check if address is oracle
(define-read-only (is-address-oracle (address principal))
  (ok (is-eq address (var-get platform-oracle)))
)
