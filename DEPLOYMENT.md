# Deployment Guide

This project deploys a single STX-native prediction market contract.

## Contract

- `predictstacksv2`

## Prerequisites

- Clarinet installed
- Account configuration in `settings/Testnet.toml` or `settings/Mainnet.toml`
- Sufficient STX for deployment fees
- `.env` configured with `STACKS_PRIVATE_KEY` for initialization (see below)

## Validate

```bash
clarinet check
```

## Deployment Plan (Clarinet)

Regenerate the deployment plan before applying to ensure fees and epochs are correct.

Testnet:

```bash
clarinet deployment generate --testnet
clarinet deployment apply --testnet
```

Mainnet:

```bash
clarinet deployment generate --mainnet
clarinet deployment apply --mainnet
```

## Initialize (post-deploy)

Initialize the contract after the deploy transaction confirms. The script defaults
admin/oracle/treasury to the deployer address unless overridden by env vars.

Testnet:

```bash
NETWORK=testnet CONTRACT_NAME=predictstacksv2 node scripts/deploy-and-init.mjs --init
```

Mainnet:

```bash
NETWORK=mainnet CONTRACT_NAME=predictstacksv2 node scripts/deploy-and-init.mjs --init
```

## Notes

- Markets are STX-native; no SIP-010 token contracts or bridge workflow are required.
- Keep admin/oracle/treasury principals secure and reviewed before deployment.
