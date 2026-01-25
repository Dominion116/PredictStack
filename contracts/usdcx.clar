;; USDCx - Mock Stablecoin for PredictStack
;; A standard SIP-010 fungible token

(impl-trait .sip010-trait.sip010-trait)

;; Constants
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-INVALID-AMOUNT (err u101))

;; Data variables
(define-data-var token-uri (optional (string-utf8 256)) none)
(define-data-var contract-owner principal tx-sender)

;; Fungible token definition
;; 6 decimals to match real USDC
(define-fungible-token usdcx)

;; Read-only functions

(define-read-only (get-name)
  (ok "USDCx")
)

(define-read-only (get-symbol)
  (ok "USDCx")
)

(define-read-only (get-decimals)
  (ok u6)
)

(define-read-only (get-balance (account principal))
  (ok (ft-get-balance usdcx account))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply usdcx))
)

(define-read-only (get-token-uri)
  (ok (var-get token-uri))
)

;; Public functions

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-INVALID-AMOUNT)
    (try! (ft-transfer? usdcx amount sender recipient))
    (match memo to-print (print to-print) 0x)
    (ok true)
  )
)

;; Faucet function for testnet
;; Mints 10,000 USDCx to the caller
(define-public (faucet)
  (begin
    (try! (ft-mint? usdcx u10000000000 tx-sender)) ;; 10,000 * 10^6
    (ok true)
  )
)

;; Mint function (owner only)
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR-NOT-AUTHORIZED)
    (try! (ft-mint? usdcx amount recipient))
    (ok true)
  )
)
