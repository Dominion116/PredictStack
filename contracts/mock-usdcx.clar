;; ============================================================================
;; Mock USDCx Token for Testing
;; ============================================================================
;; This is a simplified SIP-010 compliant token for testing the prediction market
;; In production, replace with the actual USDCx contract address
;; ============================================================================

(impl-trait .sip010-trait.sip010-trait)

;; ============================================================================
;; CONSTANTS
;; ============================================================================

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INSUFFICIENT-BALANCE (err u101))

;; Token configuration
(define-constant TOKEN-NAME "Mock USDCx")
(define-constant TOKEN-SYMBOL "mUSDCx")
(define-constant TOKEN-DECIMALS u6)

;; ============================================================================
;; DATA VARIABLES
;; ============================================================================

(define-data-var total-supply uint u0)

;; ============================================================================
;; DATA MAPS
;; ============================================================================

(define-map balances principal uint)

;; ============================================================================
;; SIP-010 TRAIT IMPLEMENTATION
;; ============================================================================

;; Transfer tokens from sender to recipient
(define-public (transfer 
  (amount uint) 
  (sender principal) 
  (recipient principal) 
  (memo (optional (buff 34)))
)
  (begin
    ;; Sender must be tx-sender or authorized contract
    (asserts! (is-eq sender tx-sender) ERR-NOT-AUTHORIZED)
    
    ;; Check balance
    (let ((sender-balance (default-to u0 (map-get? balances sender))))
      (asserts! (>= sender-balance amount) ERR-INSUFFICIENT-BALANCE)
      
      ;; Update balances
      (map-set balances sender (- sender-balance amount))
      (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
      
      ;; Print transfer event
      (print { 
        type: "transfer", 
        amount: amount, 
        sender: sender, 
        recipient: recipient, 
        memo: memo 
      })
      
      (ok true)
    )
  )
)

;; Get the token name
(define-read-only (get-name)
  (ok TOKEN-NAME)
)

;; Get the token symbol
(define-read-only (get-symbol)
  (ok TOKEN-SYMBOL)
)

;; Get the number of decimals
(define-read-only (get-decimals)
  (ok TOKEN-DECIMALS)
)

;; Get the balance of an account
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account)))
)

;; Get the total supply of the token
(define-read-only (get-total-supply)
  (ok (var-get total-supply))
)

;; Get the token URI for metadata
(define-read-only (get-token-uri)
  (ok none)
)

;; ============================================================================
;; TESTING HELPER FUNCTIONS
;; ============================================================================

;; Mint tokens (for testing only - no authorization in test environment)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
    (var-set total-supply (+ (var-get total-supply) amount))
    
    (print { type: "mint", amount: amount, recipient: recipient })
    (ok true)
  )
)

;; Faucet function - anyone can get test tokens
(define-public (faucet (amount uint))
  (begin
    ;; Limit faucet to reasonable amount (100 USDCx = 100,000,000 micro units)
    (asserts! (<= amount u100000000) ERR-NOT-AUTHORIZED)
    
    (map-set balances tx-sender (+ (default-to u0 (map-get? balances tx-sender)) amount))
    (var-set total-supply (+ (var-get total-supply) amount))
    
    (print { type: "faucet", amount: amount, recipient: tx-sender })
    (ok true)
  )
)

;; Burn tokens
(define-public (burn (amount uint))
  (let ((balance (default-to u0 (map-get? balances tx-sender))))
    (asserts! (>= balance amount) ERR-INSUFFICIENT-BALANCE)
    
    (map-set balances tx-sender (- balance amount))
    (var-set total-supply (- (var-get total-supply) amount))
    
    (print { type: "burn", amount: amount, burner: tx-sender })
    (ok true)
  )
)
