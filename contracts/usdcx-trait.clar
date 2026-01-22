;; ============================================================================
;; USDCx Trait Definition
;; ============================================================================
;; This trait extends the SIP-010 standard for USDCx-specific functionality
;; USDCx is the bridged USDC token on Stacks via Circle's xReserve protocol
;; ============================================================================

(use-trait sip010-trait .sip010-trait.sip010-trait)

;; USDCx Contract Addresses Reference:
;; 
;; TESTNET:
;; - Token: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx
;; - Bridge: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1
;;
;; MAINNET:
;; - Token: SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx
;; - Bridge: SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1
;;
;; ETHEREUM SEPOLIA (Testnet):
;; - USDC: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
;; - xReserve: 0x008888878f94C0d87defdf0B07f46B93C1934442
;;
;; ETHEREUM MAINNET:
;; - USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
;; - xReserve: 0x8888888199b2Df864bf678259607d6D5EBb4e3Ce
