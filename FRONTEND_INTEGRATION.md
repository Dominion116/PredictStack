# Frontend Integration

PredictStack is STX-native. Bet placement and claims call the market contract directly and use STX post-conditions.

## Contract Calls

- `place-bet(market-id, outcome, amount)`
- `claim-winnings(market-id)`
- `claim-refund(market-id)`

## STX Post-condition Pattern

Use an exact STX debit post-condition when placing bets:

```ts
const postConditions = Pc.principal(userAddress)
  .willSendEq(amountUstx)
  .ustx();
```

## Balance Source

Use `getStxBalance(address)` from `frontend/src/lib/stacks-api.ts`.

## Notes

- No USDCx or bridge integration is required.
- Contract identifiers are configured in `frontend/src/lib/constants.ts`.
