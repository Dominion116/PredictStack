# Deployment Guide

This project deploys a single STX-native prediction market contract.

## Contract

- `prediction-market-v6`

## Prerequisites

- Clarinet installed
- Account configuration in `settings/Testnet.toml` or `settings/Mainnet.toml`
- Sufficient STX for deployment fees

## Validate

```bash
clarinet check
```

## Testnet

```bash
clarinet deployment generate --testnet
clarinet deployment apply --testnet
```

## Mainnet

```bash
clarinet deployment generate --mainnet
clarinet deployment apply --mainnet
```

## Notes

- Markets are STX-native; no SIP-010 token contracts or bridge workflow are required.
- Keep admin/oracle/treasury principals secure and reviewed before deployment.
