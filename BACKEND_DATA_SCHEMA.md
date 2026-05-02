# Backend Data Schema

All data persisted in `backend/data/store.json` by the Node.js backend server.

## Data Collections

### `markets` — Market Metadata
Stores all prediction markets, indexed by `marketRef` (unique string identifier).

```json
{
  "mkt_abc123_xyz789": {
    "id": "mkt_abc123_xyz789",
    "marketRef": "mkt_abc123_xyz789",
    "question": "Will Bitcoin reach $100k by EOY 2025?",
    "description": "Resolves YES if BTC price exceeds $100k USD",
    "category": "Crypto",
    "imageUrl": "https://...",
    "resolveTimeIso": "2025-12-31T23:59:59Z",
    "resolveBlock": 145000,
    "createdAt": "2026-04-27T12:00:00Z",
    "updatedAt": "2026-04-27T12:00:00Z",
    "createdBy": "SP...",
    "contractMarketId": 1,
    "contractTxId": "0x...",
    "resolutionTxId": null,
    "winningOutcome": null,
    "status": "active|resolved|cancelled"
  }
}
```

### `marketRefsByContractId` — Contract ID Lookup
Maps blockchain contract market IDs to marketRef strings for fast lookup.

```json
{
  "1": "mkt_abc123_xyz789",
  "2": "mkt_def456_uvw012"
}
```

### `positions` — User Positions by Market
Tracks each user's betting position in each market.

```json
{
  "SP2C2YB838J404EJ4DNRX5X51PQX3HHGXG53FCBB3": {
    "1": {
      "userAddress": "SP2C2YB838J404EJ4DNRX5X51PQX3HHGXG53FCBB3",
      "marketId": "mkt_abc123_xyz789",
      "contractMarketId": 1,
      "yesAmountMicro": 500000,
      "noAmountMicro": 0,
      "totalWageredMicro": 500000,
      "claimableAmountMicro": 0,
      "claimed": false,
      "lastBetAt": "2026-04-27T12:15:00Z"
    }
  }
}
```

### `bets` — All Bet Records
Individual bet transactions, indexed by UUID.

```json
{
  "550e8400-e29b-41d4-a716-446655440000": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userAddress": "SP2C2YB838J404EJ4DNRX5X51PQX3HHGXG53FCBB3",
    "marketId": "mkt_abc123_xyz789",
    "contractMarketId": 1,
    "amountMicro": 500000,
    "feeMicro": 10000,
    "outcome": true,
    "status": "intent|confirmed",
    "createdAt": "2026-04-27T12:15:00Z",
    "updatedAt": "2026-04-27T12:15:30Z",
    "txId": "0x..."
  }
}
```

### `claims` — Winnings & Refund Claims
Records when users claim winnings or refunds, indexed by UUID.

```json
{
  "660e8400-e29b-41d4-a716-446655440001": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "userAddress": "SP2C2YB838J404EJ4DNRX5X51PQX3HHGXG53FCBB3",
    "contractMarketId": 1,
    "marketId": "mkt_abc123_xyz789",
    "type": "winnings|refund",
    "txId": "0x...",
    "amountMicro": 1000000,
    "createdAt": "2026-04-27T14:30:00Z"
  }
}
```

### `users` — User Profiles & Statistics
Aggregated user data, indexed by Stacks address.

```json
{
  "SP2C2YB838J404EJ4DNRX5X51PQX3HHGXG53FCBB3": {
    "address": "SP2C2YB838J404EJ4DNRX5X51PQX3HHGXG53FCBB3",
    "joinedAt": "2026-04-20T10:00:00Z",
    "updatedAt": "2026-04-27T14:30:00Z",
    "totalInvestedMicro": 1000000,
    "totalClaimedMicro": 1500000,
    "totalProfitMicro": 500000,
    "activePredictions": 3,
    "resolvedPredictions": 5,
    "winCount": 3,
    "lossCount": 2,
    "pendingClaimCount": 0,
    "totalBets": 12,
    "marketIds": ["mkt_abc123_xyz789", "mkt_def456_uvw012"]
  }
}
```

### `meta` — Store Metadata
Timestamps for store creation and last update.

```json
{
  "createdAt": "2026-04-27T21:46:45.628Z",
  "updatedAt": "2026-04-27T21:46:45.632Z"
}
```

## Data Flow

1. **Market Creation**: `POST /api/markets` → creates market record + blockchain transaction
2. **Bet Placement**: `POST /api/bets/intents` → creates bet intent, later `POST /api/bets/confirm` → updates position
3. **Market Resolution**: `POST /api/markets/:id/resolve` → updates market status + recomputes user stats
4. **Claim Winnings/Refunds**: `POST /api/claims/confirm` → creates claim record + updates position

## Persistence

- **File Location**: `backend/data/store.json` (configurable via `BACKEND_DATA_FILE` env var)
- **Atomicity**: Writes use temp file + rename pattern to prevent corruption
- **Updates**: `meta.updatedAt` set on every save operation
- **Backups**: Store any critical backups before deployments

## Access Patterns

- Markets: Query by `marketRef` (primary), lookup by `contractMarketId` (secondary via `marketRefsByContractId`)
- User Positions: `state.positions[address][contractMarketId]`
- User Stats: `state.users[address]`
- Market Bets: Filter `state.bets` by `marketId` and `status`
- Claims: Filter `state.claims` by `userAddress`
