# PredictStack - Deployment Guide

## Overview

PredictStack is a peer-to-peer prediction market platform on Stacks. This guide covers deployment, testing, and integration.

---

## Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2.0+ installed
- [Node.js](https://nodejs.org/) 18+ (for testing)
- A Stacks wallet with STX for deployment (mainnet/testnet)

---

## Project Structure

```
PredictStack/
├── Clarinet.toml              # Project configuration
├── contracts/
│   ├── sip010-trait.clar      # SIP-010 token trait
│   ├── prediction-market.clar # Main prediction market contract
│   └── mock-usdcx.clar        # Mock token for testing
├── tests/
│   └── prediction-market.test.ts  # Comprehensive tests
├── settings/
│   └── Devnet.toml            # Devnet configuration
└── README.md
```

---

## Local Development

### 1. Install Dependencies

```bash
cd PredictStack
npm install
```

### 2. Check Contracts

```bash
clarinet check
```

This validates all contracts and their dependencies.

### 3. Run Tests

```bash
npm test
# or
clarinet test
```

### 4. Interactive Console

```bash
clarinet console
```

This opens an interactive REPL for testing contract functions.

---

## Console Testing Examples

```clarity
;; Initialize the platform
(contract-call? .prediction-market initialize 
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM  ;; admin
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM  ;; oracle
  'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM  ;; treasury
  u200                                          ;; 2% fee
  u1000000)                                     ;; 1 USDCx min bet

;; Mint test tokens
(contract-call? .mock-usdcx mint u100000000 tx-sender)

;; Create a market
(contract-call? .prediction-market create-market 
  "Will BTC reach $100k by end of 2025?"
  none
  u1000                                         ;; resolve at block 1000
  .mock-usdcx)

;; Place a bet
(contract-call? .prediction-market place-bet 
  u1                                            ;; market-id
  true                                          ;; YES outcome
  u10000000                                     ;; 10 USDCx
  .mock-usdcx)

;; Get market details
(contract-call? .prediction-market get-market u1)

;; Get current odds
(contract-call? .prediction-market get-current-odds u1)

;; Calculate potential payout
(contract-call? .prediction-market calculate-potential-payout u1 true u5000000)
```

---

## Testnet Deployment

### 1. Configure Testnet

Create/update `settings/Testnet.toml`:

```toml
[network]
name = "testnet"
stacks_node_rpc_address = "https://stacks-node-api.testnet.stacks.co"

[accounts.deployer]
mnemonic = "your-testnet-mnemonic-here"
```

### 2. Deploy to Testnet

```bash
clarinet deployment generate --testnet
clarinet deployment apply --testnet
```

### 3. Verify Deployment

After deployment, note the contract addresses:
- `sip010-trait`: `ST...xxx.sip010-trait`
- `prediction-market`: `ST...xxx.prediction-market`
- `mock-usdcx`: `ST...xxx.mock-usdcx` (for testing only)

---

## Mainnet Deployment

### 1. Production Considerations

Before mainnet deployment:

1. **Security Audit**: Get the contracts audited by a professional security firm
2. **Testing**: Thoroughly test on testnet with real users
3. **USDCx Integration**: Replace `mock-usdcx` with the actual USDCx contract address
4. **Multi-sig**: Consider using a multi-sig wallet for admin/treasury

### 2. USDCx Integration

Update the contract calls to use the real USDCx contract:

```clarity
;; Mainnet USDCx (example - verify actual address)
'SP2XD7417HGPRTREMKF748VNEQPDRR0RMANB7X1NK.token-usdcx
```

### 3. Configure Mainnet

Create `settings/Mainnet.toml`:

```toml
[network]
name = "mainnet"
stacks_node_rpc_address = "https://stacks-node-api.mainnet.stacks.co"

[accounts.deployer]
mnemonic = "your-mainnet-mnemonic-here"
```

### 4. Deploy to Mainnet

```bash
clarinet deployment generate --mainnet
clarinet deployment apply --mainnet
```

---

## Post-Deployment Initialization

After deployment, initialize the contract:

```clarity
(contract-call? 'SP...xxx.prediction-market initialize
  'SP...admin-address
  'SP...oracle-address
  'SP...treasury-address
  u200        ;; 2% fee (200 basis points)
  u1000000)   ;; 1 USDCx minimum bet
```

---

## Contract Addresses Reference

### Testnet (Example)
```
sip010-trait:      ST...xxx.sip010-trait
prediction-market: ST...xxx.prediction-market  
```

### Mainnet (TBD)
```
sip010-trait:      SP...xxx.sip010-trait
prediction-market: SP...xxx.prediction-market
```

---

## Security Checklist

Before going live:

- [ ] All admin functions require proper authorization
- [ ] Platform can be paused in emergencies
- [ ] Reentrancy protection on claim functions (checks-effects-interactions)
- [ ] Input validation on all public functions
- [ ] Overflow protection in calculations
- [ ] Oracle address can be updated in case of compromise
- [ ] Treasury address is secure (consider multi-sig)
- [ ] Tested all edge cases (one-sided markets, multiple claimers, etc.)

---

## Troubleshooting

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `u100` | Not authorized | Check caller permissions (admin/oracle) |
| `u101` | Market not found | Verify market ID exists |
| `u102` | Market already resolved | Cannot modify resolved markets |
| `u103` | Market not resolved | Wait for resolution before claiming |
| `u105` | Insufficient balance | User needs more tokens |
| `u106` | Already claimed | Position already claimed |
| `u108` | Wrong outcome | User bet on losing side |
| `u109` | Platform paused | Admin must unpause |
| `u110` | Invalid amount | Check min bet/fee limits |
| `u111` | Deadline passed | Cannot bet after resolve date |
| `u115` | Already initialized | Contract can only be initialized once |

---

## Upgrade Strategy

Clarity contracts are immutable after deployment. For upgrades:

1. Deploy new contract version
2. Set old contract to paused state
3. Migrate any pending funds/data if needed
4. Point frontend to new contract
5. Allow claims on old contract to complete

---

## Support

For issues or questions:
- Open an issue on GitHub
- Contact: support@predictstack.io (placeholder)
