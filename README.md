# PredictStack

A peer-to-peer prediction market platform on Stacks where users bet on binary outcomes (YES/NO) using native STX.

## Overview

PredictStack enables users to:
- Create binary prediction markets
- Place YES/NO bets in STX
- Claim winnings after resolution
- Claim refunds if markets are cancelled

Funds are escrowed in the market contract and distributed during settlement.

## Contracts

- `contracts/prediction-market-v6.clar`: Main market logic using STX transfers

## Quick Start

Requirements:
- Clarinet
- Node.js 18+

Install dependencies:

```bash
npm install
```

Validate contracts:

```bash
clarinet check
```

Run tests:

```bash
npm test
```

## Docs

- `DEPLOYMENT.md`: Deployment steps for testnet/mainnet
- `FRONTEND_INTEGRATION.md`: Frontend integration for STX post-conditions and contract calls
