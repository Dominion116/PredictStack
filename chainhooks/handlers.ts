/**
 * PredictStack — Chainhook Event Handlers
 * =========================================
 * Routes incoming payloads to the correct handler by predicate UUID.
 *
 * Why UUID-based routing?
 *   The Chainhook payload only contains: uuid, predicate (if_this shape),
 *   and is_streaming_blocks. There is no `name` or `spec` field in the
 *   webhook body. UUIDs are stable (defined in predicates.ts UUIDS const)
 *   so they're safe to use as routing keys.
 *
 * Payload shape (from actual schema):
 *   payload.chainhook.uuid              — which predicate fired
 *   payload.chainhook.predicate         — the if_this condition (scope, etc.)
 *   payload.chainhook.is_streaming_blocks
 *   payload.apply[]                     — confirmed blocks
 *   payload.rollback[]                  — reorged blocks
 *
 * SmartContractEvent.data shape (actual schema):
 *   { contract_identifier, raw_value, topic }
 *   NOTE: decoded value is in raw_value when decode_clarity_values: true
 *         is set on the predicate (we set this for all print events).
 */

import type { Payload } from '@hirosystems/chainhook-client';

// ── Typed Clarity print event shapes ─────────────────────────────────────────

interface MarketCreatedEvent {
  event: 'market-created';
  'market-id': bigint;
  question: string;
  creator: string;
  'resolve-date': bigint;
  'ipfs-hash'?: string;
  'block-height': bigint;
}

interface MarketResolvedEvent {
  event: 'market-resolved';
  'market-id': bigint;
  'winning-outcome': boolean;
  'yes-pool': bigint;
  'no-pool': bigint;
  'resolved-by': string;
  'block-height': bigint;
}

interface MarketCancelledEvent {
  event: 'market-cancelled';
  'market-id': bigint;
  'yes-pool': bigint;
  'no-pool': bigint;
  'cancelled-by': string;
  'block-height': bigint;
}

interface BetPlacedEvent {
  event: 'bet-placed';
  'market-id': bigint;
  user: string;
  outcome: boolean;
  amount: bigint;
  'new-yes-pool': bigint;
  'new-no-pool': bigint;
  'block-height': bigint;
}

interface WinningsClaimedEvent {
  event: 'winnings-claimed';
  'market-id': bigint;
  user: string;
  'winning-stake': bigint;
  'profit-share': bigint;
  'platform-fee': bigint;
  'net-winnings': bigint;
  'total-payout': bigint;
  'block-height': bigint;
}

interface RefundClaimedEvent {
  event: 'refund-claimed';
  'market-id': bigint;
  user: string;
  'refund-amount': bigint;
  'block-height': bigint;
}

// ── Stable UUID → handler map ─────────────────────────────────────────────────
// Must match the UUIDS const in predicates.ts exactly.
// Routing by UUID because the Chainhook payload has no `name` field —
// only uuid, predicate (if_this shape), and is_streaming_blocks.
const UUID_HANDLERS: Record<string, (payload: Payload) => Promise<void>> = {
  '11111111-0000-0000-0000-000000000001': onAdminEvent,   // platform-initialized
  '11111111-0000-0000-0000-000000000002': onMarketCreated,
  '11111111-0000-0000-0000-000000000003': onMarketResolved,
  '11111111-0000-0000-0000-000000000004': onMarketCancelled,
  '11111111-0000-0000-0000-000000000005': onBetPlaced,
  '11111111-0000-0000-0000-000000000006': onWinningsClaimed,
  '11111111-0000-0000-0000-000000000007': onRefundClaimed,
  '11111111-0000-0000-0000-000000000008': onAdminEvent,   // fee-updated
  '11111111-0000-0000-0000-000000000009': onAdminEvent,   // oracle-updated
  '11111111-0000-0000-0000-000000000010': onAdminEvent,   // admin-updated
  '11111111-0000-0000-0000-000000000011': onAdminEvent,   // treasury-updated
  '11111111-0000-0000-0000-000000000012': onAdminEvent,   // platform-paused
  '11111111-0000-0000-0000-000000000013': onAdminEvent,   // platform-unpaused
  '11111111-0000-0000-0000-000000000014': onAdminEvent,   // min-bet-updated
  '11111111-0000-0000-0000-000000000015': onUsdcxMint,
  '11111111-0000-0000-0000-000000000016': onUsdcxTransfer,
  '11111111-0000-0000-0000-000000000017': onUsdcxBurn,
  '11111111-0000-0000-0000-000000000018': onStxFromContract,
  '11111111-0000-0000-0000-000000000019': onDeployment,   // deployer-contracts
};

// ── Main router ───────────────────────────────────────────────────────────────

export async function handlePredictStackEvent(
  uuid: string,
  payload: Payload
): Promise<void> {
  const handler = UUID_HANDLERS[uuid];
  if (!handler) {
    console.warn(`[chainhook] No handler for uuid: ${uuid} (scope: ${(payload.chainhook as any)?.predicate?.scope})`);
    return;
  }
  await handler(payload);
}

// ── Helper: extract decoded Clarity print values ──────────────────────────────
// SmartContractEvent.data has: { contract_identifier, raw_value, topic }
// When decode_clarity_values: true is set on the predicate, raw_value
// contains the decoded Clarity value (JSON-like object), not raw hex.

function extractPrintData<T>(payload: Payload): { apply: T[]; rollback: T[] } {
  const apply: T[] = [];
  const rollback: T[] = [];

  for (const block of (payload as any).apply ?? []) {
    for (const tx of block.transactions ?? []) {
      for (const event of tx.metadata?.receipt?.events ?? []) {
        if (event.type === 'SmartContractEvent') {
          // raw_value holds the decoded Clarity tuple when decode_clarity_values: true
          apply.push(event.data?.raw_value as T);
        }
      }
    }
  }

  for (const block of (payload as any).rollback ?? []) {
    for (const tx of block.transactions ?? []) {
      for (const event of tx.metadata?.receipt?.events ?? []) {
        if (event.type === 'SmartContractEvent') {
          rollback.push(event.data?.raw_value as T);
        }
      }
    }
  }

  return { apply, rollback };
}

// ── Business event handlers ───────────────────────────────────────────────────

async function onMarketCreated(payload: Payload): Promise<void> {
  const { apply, rollback } = extractPrintData<MarketCreatedEvent>(payload);

  for (const event of apply) {
    console.log(`[market-created] ID: ${event['market-id']} | "${event.question}"`);
    // TODO: upsert into your markets table / invalidate React Query cache
  }
  for (const event of rollback) {
    console.log(`[market-created ROLLBACK] ID: ${event['market-id']}`);
    // TODO: delete the market record that was rolled back
  }
}

async function onMarketResolved(payload: Payload): Promise<void> {
  const { apply, rollback } = extractPrintData<MarketResolvedEvent>(payload);

  for (const event of apply) {
    const winner = event['winning-outcome'] ? 'YES' : 'NO';
    console.log(`[market-resolved] ID: ${event['market-id']} | Winner: ${winner}`);
    // TODO: update market status to "resolved", store winning-outcome
    // TODO: trigger push notification to all bettors in this market
  }
  for (const event of rollback) {
    console.log(`[market-resolved ROLLBACK] ID: ${event['market-id']}`);
    // TODO: revert market status back to "open"
  }
}

async function onMarketCancelled(payload: Payload): Promise<void> {
  const { apply, rollback } = extractPrintData<MarketCancelledEvent>(payload);

  for (const event of apply) {
    console.log(`[market-cancelled] ID: ${event['market-id']}`);
    // TODO: update market status to "cancelled"
    // TODO: notify bettors they can claim refunds
  }
  for (const event of rollback) {
    console.log(`[market-cancelled ROLLBACK] ID: ${event['market-id']}`);
  }
}

async function onBetPlaced(payload: Payload): Promise<void> {
  const { apply, rollback } = extractPrintData<BetPlacedEvent>(payload);

  for (const event of apply) {
    const side   = event.outcome ? 'YES' : 'NO';
    const amount = Number(event.amount) / 1_000_000;
    console.log(`[bet-placed] Market: ${event['market-id']} | ${event.user} bet ${amount} USDCx on ${side}`);
    // TODO: insert bet record
    // TODO: update market yes-pool / no-pool in your DB
    // TODO: push live pool update via WebSocket / SSE to active clients
  }
  for (const event of rollback) {
    console.log(`[bet-placed ROLLBACK] Market: ${event['market-id']} | User: ${event.user}`);
    // TODO: delete bet record, revert pool totals
  }
}

async function onWinningsClaimed(payload: Payload): Promise<void> {
  const { apply, rollback } = extractPrintData<WinningsClaimedEvent>(payload);

  for (const event of apply) {
    const net = Number(event['net-winnings']) / 1_000_000;
    console.log(`[winnings-claimed] Market: ${event['market-id']} | ${event.user} won ${net} USDCx`);
    // TODO: mark bet as "claimed" in DB
    // TODO: update leaderboard — add net-winnings to user's profit total
  }
  for (const event of rollback) {
    console.log(`[winnings-claimed ROLLBACK] Market: ${event['market-id']}`);
    // TODO: undo leaderboard update
  }
}

async function onRefundClaimed(payload: Payload): Promise<void> {
  const { apply, rollback } = extractPrintData<RefundClaimedEvent>(payload);

  for (const event of apply) {
    const amount = Number(event['refund-amount']) / 1_000_000;
    console.log(`[refund-claimed] Market: ${event['market-id']} | ${event.user} refunded ${amount} USDCx`);
    // TODO: mark bet as "refunded"
  }
  for (const event of rollback) {
    console.log(`[refund-claimed ROLLBACK] Market: ${event['market-id']}`);
  }
}

// ── FT event handlers ─────────────────────────────────────────────────────────

async function onUsdcxMint(payload: Payload): Promise<void> {
  for (const block of (payload as any).apply ?? []) {
    for (const tx of block.transactions ?? []) {
      for (const event of tx.metadata?.receipt?.events ?? []) {
        if (event.type === 'FTMintEvent') {
          const amount = Number(event.data?.amount) / 1_000_000;
          console.log(`[usdcx-mint] ${amount} USDCx minted to ${event.data?.recipient}`);
          // TODO: update user balance / invalidate balance cache
        }
      }
    }
  }
}

async function onUsdcxTransfer(payload: Payload): Promise<void> {
  for (const block of (payload as any).apply ?? []) {
    for (const tx of block.transactions ?? []) {
      for (const event of tx.metadata?.receipt?.events ?? []) {
        if (event.type === 'FTTransferEvent') {
          const amount = Number(event.data?.amount) / 1_000_000;
          console.log(`[usdcx-transfer] ${amount} USDCx | ${event.data?.sender} → ${event.data?.recipient}`);
          // TODO: update sender/recipient balances
        }
      }
    }
  }
}

async function onUsdcxBurn(payload: Payload): Promise<void> {
  for (const block of (payload as any).apply ?? []) {
    for (const tx of block.transactions ?? []) {
      for (const event of tx.metadata?.receipt?.events ?? []) {
        if (event.type === 'FTBurnEvent') {
          const amount = Number(event.data?.amount) / 1_000_000;
          console.log(`[usdcx-burn] ${amount} USDCx burned from ${event.data?.sender}`);
          // TODO: update sender balance, log bridge withdrawal
        }
      }
    }
  }
}

// ── STX handler ───────────────────────────────────────────────────────────────

async function onStxFromContract(payload: Payload): Promise<void> {
  // stx_event has no sender filter — manually check sender matches our contract
  const PM_TESTNET = 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY.prediction-market-v6';
  const PM_MAINNET = 'SP....prediction-market-v3'; // TODO: update for mainnet

  for (const block of (payload as any).apply ?? []) {
    for (const tx of block.transactions ?? []) {
      for (const event of tx.metadata?.receipt?.events ?? []) {
        if (event.type === 'STXTransferEvent') {
          const sender = event.data?.sender as string | undefined;
          if (sender !== PM_TESTNET && sender !== PM_MAINNET) continue;

          const amount = Number(event.data?.amount) / 1_000_000;
          console.warn(`[stx-from-contract] ⚠️  Unexpected STX: ${amount} STX → ${event.data?.recipient}`);
          // TODO: alert ops — this shouldn't happen normally
        }
      }
    }
  }
}

// ── Admin / deployment handlers ───────────────────────────────────────────────

async function onAdminEvent(payload: Payload): Promise<void> {
  const scope = (payload.chainhook as any)?.predicate?.scope ?? 'admin';
  const uuid  = (payload.chainhook as any)?.uuid ?? 'unknown';
  for (const block of (payload as any).apply ?? []) {
    for (const tx of block.transactions ?? []) {
      console.log(`[admin:${scope}] uuid: ${uuid} | tx: ${tx.transaction_identifier?.hash}`);
      // TODO: send alert to admin Slack/Discord channel
    }
  }
}

async function onDeployment(payload: Payload): Promise<void> {
  for (const block of (payload as any).apply ?? []) {
    for (const tx of block.transactions ?? []) {
      const kind = tx.metadata?.kind;
      if (kind?.type === 'ContractDeployment') {
        const contractId = kind.data?.contract_identifier ?? 'unknown';
        // Filter: only log our specific contracts (deployer predicate catches all)
        if (!contractId.includes('prediction-market') && !contractId.includes('usdcx')) continue;
        console.log(`[deployment] ${contractId} at block ${block.block_identifier?.index} | tx: ${tx.transaction_identifier?.hash}`);
        // TODO: update your internal contract registry
      }
    }
  }
}