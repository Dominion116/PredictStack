;; ============================================================================
;; PredictStack V3 - Stability Build (Clarity 1)
;; ============================================================================

;; Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-MARKET-NOT-FOUND (err u101))
(define-constant ERR-MARKET-RESOLVED (err u102))
(define-constant STATUS-ACTIVE u0)
(define-constant STATUS-RESOLVED u1)

;; HARDCODED TOKEN CONTRACT
(define-constant USDCX-CONTRACT 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY.usdcx-v1)

;; Variables
(define-data-var next-market-id uint u1)
(define-data-var contract-initialized bool false)

;; Maps
(define-map markets
  { market-id: uint }
  {
    question: (string-ascii 256),
    creator: principal,
    resolve-date: uint,
    yes-pool: uint,
    no-pool: uint,
    status: uint,
    winning-outcome: (optional bool)
  }
)

(define-map user-positions
  { user: principal, market-id: uint }
  {
    yes-amount: uint,
    no-amount: uint,
    claimed: bool
  }
)

;; Admin
(define-public (initialize)
  (begin
    (asserts! (not (var-get contract-initialized)) (err u115))
    (var-set contract-initialized true)
    (ok true)
  )
)

;; Core Logic
(define-public (create-market 
  (question (string-ascii 256))
  (resolve-date uint)
)
  (let ((market-id (var-get next-market-id)))
    (map-set markets
      { market-id: market-id }
      {
        question: question,
        creator: tx-sender,
        resolve-date: resolve-date,
        yes-pool: u0,
        no-pool: u0,
        status: STATUS-ACTIVE,
        winning-outcome: none
      }
    )
    (var-set next-market-id (+ market-id u1))
    (ok market-id)
  )
)

(define-public (place-bet 
  (market-id uint) 
  (outcome bool) 
  (amount uint)
)
  (let
    (
      (market (unwrap! (map-get? markets { market-id: market-id }) ERR-MARKET-NOT-FOUND))
      (existing-position (default-to 
        { yes-amount: u0, no-amount: u0, claimed: false }
        (map-get? user-positions { user: tx-sender, market-id: market-id })
      ))
    )
    ;; Hardcoded transfer call
    (try! (contract-call? 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY.usdcx-v1 transfer amount tx-sender (as-contract tx-sender) none))
    
    (map-set user-positions
      { user: tx-sender, market-id: market-id }
      {
        yes-amount: (if outcome (+ (get yes-amount existing-position) amount) (get yes-amount existing-position)),
        no-amount: (if outcome (get no-amount existing-position) (+ (get no-amount existing-position) amount)),
        claimed: false
      }
    )
    
    (map-set markets
      { market-id: market-id }
      (merge market {
        yes-pool: (if outcome (+ (get yes-pool market) amount) (get yes-pool market)),
        no-pool: (if outcome (get no-pool market) (+ (get no-pool market) amount))
      })
    )
    (ok true)
  )
)

(define-read-only (get-market (market-id uint))
  (ok (unwrap! (map-get? markets { market-id: market-id }) ERR-MARKET-NOT-FOUND))
)
