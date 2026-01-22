# PredictStack

A peer-to-peer prediction market platform on Stacks blockchain where users can bet on binary outcomes (YES/NO) using USDCx tokens.

[![Clarity](https://img.shields.io/badge/Clarity-2.0-blue)](https://clarity-lang.org/)
[![Stacks](https://img.shields.io/badge/Stacks-Blockchain-purple)](https://stacks.co/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Overview

PredictStack enables users to:
- **Create prediction markets** on any binary outcome
- **Place bets** on YES or NO outcomes using USDCx tokens
- **Earn winnings** proportional to their stake when they predict correctly
- **Claim refunds** if markets are cancelled

All funds are held in escrow within the smart contract and distributed to winners after market resolution.

---

## Features

### For Users
- 🎯 Bet on binary outcomes (YES/NO)
- 💰 Earn winnings from the losing pool proportional to your stake
- 📊 Real-time odds calculation
- 🔄 Support for hedging (betting on both sides)
- 💵 USDCx token integration

### For Platform
- 🔐 Secure admin/oracle access controls
- ⚡ Platform fee collection (configurable)
- 🛑 Emergency pause functionality
- 📈 Comprehensive statistics tracking
- 🎫 Market cancellation with full refunds

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PredictStack Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│   │    Admin     │    │    Oracle    │    │   Treasury   │  │
│   │  (Platform)  │    │ (Resolution) │    │   (Fees)     │  │
│   └──────────────┘    └──────────────┘    └──────────────┘  │
│          │                   │                   ▲          │
│          ▼                   ▼                   │          │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              prediction-market.clar                  │   │
│   │                                                      │   │
│   │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│   │  │ Markets │  │  Bets   │  │ Payouts │              │   │
│   │  └─────────┘  └─────────┘  └─────────┘              │   │
│   │                                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│          │                   │                   │          │
│          ▼                   ▼                   ▼          │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                   USDCx Token                        │   │
│   │               (SIP-010 Compliant)                    │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2.0+
- [Node.js](https://nodejs.org/) 18+

### Installation

```bash
git clone https://github.com/your-username/PredictStack.git
cd PredictStack
npm install
```

### Run Tests

```bash
npm test
# or
clarinet test
```

### Check Contracts

```bash
clarinet check
```

### Interactive Console

```bash
clarinet console
```

---

## Contracts

| Contract | Description |
|----------|-------------|
| `sip010-trait.clar` | SIP-010 token trait definition |
| `prediction-market.clar` | Main prediction market logic |
| `mock-usdcx.clar` | Mock token for testing |

---

## Core Functions

### User Functions

| Function | Description |
|----------|-------------|
| `place-bet` | Place a bet on YES or NO outcome |
| `claim-winnings` | Claim winnings after market resolution |
| `claim-refund` | Claim refund for cancelled markets |

### Admin Functions

| Function | Description |
|----------|-------------|
| `initialize` | Initialize platform configuration |
| `create-market` | Create a new prediction market |
| `resolve-market` | Resolve market with winning outcome |
| `cancel-market` | Cancel market (triggers refunds) |
| `pause-platform` | Emergency pause |
| `set-platform-fee` | Update fee percentage |

### Read-Only Functions

| Function | Description |
|----------|-------------|
| `get-market` | Get market details |
| `get-user-position` | Get user's position in a market |
| `get-current-odds` | Get current YES/NO odds |
| `calculate-potential-payout` | Estimate winnings for a bet |
| `get-platform-stats` | Get platform statistics |

---

## Payout Calculation

When a market resolves:

1. **Winning Pool** = Total staked on winning side
2. **Losing Pool** = Total staked on losing side
3. **User Share** = (User Stake / Winning Pool) × Losing Pool
4. **Platform Fee** = User Share × Fee Percentage
5. **Net Winnings** = User Share - Platform Fee
6. **Total Payout** = Original Stake + Net Winnings

### Example

- Market: "Will ETH reach $5k?"
- YES Pool: 1,000 USDCx
- NO Pool: 4,000 USDCx
- User bets: 100 USDCx on YES
- Result: YES wins

Calculation:
- User Share: (100 / 1,000) × 4,000 = 400 USDCx
- Platform Fee (2%): 400 × 0.02 = 8 USDCx
- Net Winnings: 400 - 8 = 392 USDCx
- **Total Payout: 100 + 392 = 492 USDCx** (4.92x return!)

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| u100 | ERR-NOT-AUTHORIZED | Caller lacks permission |
| u101 | ERR-MARKET-NOT-FOUND | Market ID doesn't exist |
| u102 | ERR-MARKET-RESOLVED | Market already resolved |
| u103 | ERR-MARKET-NOT-RESOLVED | Market not yet resolved |
| u105 | ERR-INSUFFICIENT-BALANCE | Not enough tokens |
| u106 | ERR-ALREADY-CLAIMED | Position already claimed |
| u107 | ERR-NO-POSITION | User has no position |
| u108 | ERR-WRONG-OUTCOME | User bet on losing side |
| u109 | ERR-PLATFORM-PAUSED | Platform is paused |
| u110 | ERR-INVALID-AMOUNT | Amount below minimum |
| u111 | ERR-DEADLINE-PASSED | Past betting deadline |

---

## Security Features

- ✅ **Reentrancy Protection**: Checks-effects-interactions pattern
- ✅ **Access Control**: Admin/Oracle role separation
- ✅ **Emergency Pause**: Platform can be paused instantly
- ✅ **Input Validation**: All inputs validated
- ✅ **Overflow Protection**: Safe math operations
- ✅ **Refund Mechanism**: Full refunds for cancelled markets

---

## Documentation

- [Deployment Guide](./DEPLOYMENT.md) - How to deploy to testnet/mainnet
- [Frontend Integration](./FRONTEND_INTEGRATION.md) - How to build a frontend

---

## Development

### Project Structure

```
PredictStack/
├── Clarinet.toml              # Project config
├── contracts/
│   ├── sip010-trait.clar      # Token trait
│   ├── prediction-market.clar # Main contract
│   └── mock-usdcx.clar        # Test token
├── tests/
│   └── prediction-market.test.ts
├── settings/
│   └── Devnet.toml
├── DEPLOYMENT.md
├── FRONTEND_INTEGRATION.md
└── README.md
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
clarinet test tests/prediction-market.test.ts

# Run with coverage
clarinet test --coverage
```

---

## Roadmap

- [ ] Market categories/tags
- [ ] Multi-outcome markets (beyond binary)
- [ ] Liquidity provider incentives
- [ ] DAO governance for oracle disputes
- [ ] Cross-chain market creation
- [ ] Mobile app integration

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Submit a pull request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Disclaimer

This software is provided "as is" without warranty. Use at your own risk. Always conduct proper security audits before deploying to mainnet with real funds.
