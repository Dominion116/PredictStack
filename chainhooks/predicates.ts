/**
 * PredictStack — Chainhook Predicates
 * ====================================
 * Type notes from actual installed package (dist/index.d.ts):
 *
 *   EventObserverPredicate  — what server.start() accepts (NO uuid field)
 *   Predicate               — full predicate shape (HAS uuid field)
 *   EventObserverOptions    — was ServerOptions (doesn't exist)
 *
 *   ft_event                — correct FT scope (not "fungible_token_event")
 *   stx_event               — no `sender` filter in this version
 *   contract_deployment     — only `deployer` or `implement_trait` (no contract_name_starts_with)
 *
 * We define predicates with uuid (using Predicate) for stable registration,
 * then strip uuid when passing to server.start() via getActivePredicates().
 */

import type {
  Predicate,
  EventObserverPredicate,
  StacksIfThisFtEvent,
  StacksIfThisPrintEvent,
  StacksIfThisStxEvent,
  StacksIfThisContractDeployment,
} from '@hirosystems/chainhook-client';

// ── Contract identifiers ─────────────────────────────────────────────────────
const TESTNET_DEPLOYER    = 'ST30VGN68PSGVWGNMD0HH2WQMM5T486EK3WBNTHCY';
const MAINNET_DEPLOYER    = 'SP...'; // TODO: fill in once deployed to mainnet

const PM_CONTRACT_TESTNET = `${TESTNET_DEPLOYER}.prediction-market-v6`;
const PM_CONTRACT_MAINNET = `${MAINNET_DEPLOYER}.prediction-market-v3`;

const USDCX_TESTNET       = `${TESTNET_DEPLOYER}.usdcx-v1`;
const USDCX_MAINNET       = 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx';

// ── Active network ───────────────────────────────────────────────────────────
export const activeNetwork = (
  process.env.NEXT_PUBLIC_NETWORK ?? process.env.NETWORK ?? 'testnet'
) as 'testnet' | 'mainnet';

// ── Stable UUIDs ─────────────────────────────────────────────────────────────
// Must be stable across restarts — Chainhook deduplicates by UUID.
// Changing a UUID = orphaned predicate on the hosted node.
const UUIDS = {
  platformInitialized:  '11111111-0000-0000-0000-000000000001',
  marketCreated:        '11111111-0000-0000-0000-000000000002',
  marketResolved:       '11111111-0000-0000-0000-000000000003',
  marketCancelled:      '11111111-0000-0000-0000-000000000004',
  betPlaced:            '11111111-0000-0000-0000-000000000005',
  winningsClaimed:      '11111111-0000-0000-0000-000000000006',
  refundClaimed:        '11111111-0000-0000-0000-000000000007',
  feeUpdated:           '11111111-0000-0000-0000-000000000008',
  oracleUpdated:        '11111111-0000-0000-0000-000000000009',
  adminUpdated:         '11111111-0000-0000-0000-000000000010',
  treasuryUpdated:      '11111111-0000-0000-0000-000000000011',
  platformPaused:       '11111111-0000-0000-0000-000000000012',
  platformUnpaused:     '11111111-0000-0000-0000-000000000013',
  minBetUpdated:        '11111111-0000-0000-0000-000000000014',
  usdcxMint:            '11111111-0000-0000-0000-000000000015',
  usdcxTransfer:        '11111111-0000-0000-0000-000000000016',
  usdcxBurn:            '11111111-0000-0000-0000-000000000017',
  stxFromContract:      '11111111-0000-0000-0000-000000000018',
  deployerContracts:    '11111111-0000-0000-0000-000000000019',
} as const;

// ── Stacks-specific network config ───────────────────────────────────────────
// Narrows the wide Bitcoin|Stacks union in Predicate.networks down to just
// the Stacks shape, so TS accepts ft_event / print_event / stx_event.
interface StacksNetworkConfig {
  start_block?: number;
  end_block?: number;
  expire_after_occurrence?: number;
  decode_clarity_values?: boolean;
  include_contract_abi?: boolean;
  if_this:
    | StacksIfThisFtEvent
    | StacksIfThisPrintEvent
    | StacksIfThisStxEvent
    | StacksIfThisContractDeployment;
}

// Our internal predicate type — has uuid for stable registration tracking.
// Structurally compatible with Predicate but with narrowed networks.
interface StacksPredicate extends Omit<Predicate, 'networks'> {
  networks: {
    testnet?: StacksNetworkConfig;
    mainnet?: StacksNetworkConfig;
  };
}

// ===========================================================================
// Helper
// ===========================================================================

function printEvent(uuid: string, name: string, contains: string): StacksPredicate {
  return {
    uuid,
    name,
    version: 1,
    chain: 'stacks',
    networks: {
      testnet: {
        decode_clarity_values: true,
        if_this: {
          scope: 'print_event',
          contract_identifier: PM_CONTRACT_TESTNET,
          contains,
        } satisfies StacksIfThisPrintEvent,
      },
      mainnet: {
        decode_clarity_values: true,
        if_this: {
          scope: 'print_event',
          contract_identifier: PM_CONTRACT_MAINNET,
          contains,
        } satisfies StacksIfThisPrintEvent,
      },
    },
  };
}

// ===========================================================================
// 1. PRINT EVENTS
// ===========================================================================

export const platformInitialized = printEvent(UUIDS.platformInitialized, 'predictstack-platform-initialized', 'platform-initialized');

/** ⭐ CRITICAL — populates market listing on the frontend. */
export const marketCreated       = printEvent(UUIDS.marketCreated,       'predictstack-market-created',       'market-created');

/** ⭐ CRITICAL — triggers winner payouts & UI flip to "resolved". */
export const marketResolved      = printEvent(UUIDS.marketResolved,      'predictstack-market-resolved',      'market-resolved');
export const marketCancelled     = printEvent(UUIDS.marketCancelled,     'predictstack-market-cancelled',     'market-cancelled');

/** ⭐ CRITICAL — drives live pool display and recent-activity feed. */
export const betPlaced           = printEvent(UUIDS.betPlaced,           'predictstack-bet-placed',           'bet-placed');

/** ⭐ CRITICAL — drives leaderboard profit aggregation. */
export const winningsClaimed     = printEvent(UUIDS.winningsClaimed,     'predictstack-winnings-claimed',     'winnings-claimed');
export const refundClaimed       = printEvent(UUIDS.refundClaimed,       'predictstack-refund-claimed',       'refund-claimed');
export const feeUpdated          = printEvent(UUIDS.feeUpdated,          'predictstack-fee-updated',          'fee-updated');
export const oracleUpdated       = printEvent(UUIDS.oracleUpdated,       'predictstack-oracle-updated',       'oracle-updated');
export const adminUpdated        = printEvent(UUIDS.adminUpdated,        'predictstack-admin-updated',        'admin-updated');
export const treasuryUpdated     = printEvent(UUIDS.treasuryUpdated,     'predictstack-treasury-updated',     'treasury-updated');
export const platformPaused      = printEvent(UUIDS.platformPaused,      'predictstack-platform-paused',      'platform-paused');
export const platformUnpaused    = printEvent(UUIDS.platformUnpaused,    'predictstack-platform-unpaused',    'platform-unpaused');
export const minBetUpdated       = printEvent(UUIDS.minBetUpdated,       'predictstack-min-bet-updated',      'min-bet-updated');

// ===========================================================================
// 2. FUNGIBLE TOKEN EVENTS  (scope: "ft_event")
// ===========================================================================

/** 2-A | USDCx mint — faucet() or bridge deposit */
export const usdcxMint: StacksPredicate = {
  uuid: UUIDS.usdcxMint,
  name: 'predictstack-usdcx-mint',
  version: 1,
  chain: 'stacks',
  networks: {
    testnet: { if_this: { scope: 'ft_event', asset_identifier: `${USDCX_TESTNET}::usdcx`, actions: ['mint'] } satisfies StacksIfThisFtEvent },
    mainnet: { if_this: { scope: 'ft_event', asset_identifier: `${USDCX_MAINNET}::usdcx`, actions: ['mint'] } satisfies StacksIfThisFtEvent },
  },
};

/** 2-B | USDCx transfer — place-bet / claim-winnings / claim-refund / wallet transfer */
export const usdcxTransfer: StacksPredicate = {
  uuid: UUIDS.usdcxTransfer,
  name: 'predictstack-usdcx-transfer',
  version: 1,
  chain: 'stacks',
  networks: {
    testnet: { if_this: { scope: 'ft_event', asset_identifier: `${USDCX_TESTNET}::usdcx`, actions: ['transfer'] } satisfies StacksIfThisFtEvent },
    mainnet: { if_this: { scope: 'ft_event', asset_identifier: `${USDCX_MAINNET}::usdcx`, actions: ['transfer'] } satisfies StacksIfThisFtEvent },
  },
};

/** 2-C | USDCx burn — bridge withdrawal to Ethereum */
export const usdcxBurn: StacksPredicate = {
  uuid: UUIDS.usdcxBurn,
  name: 'predictstack-usdcx-burn',
  version: 1,
  chain: 'stacks',
  networks: {
    testnet: {
      if_this: {
        scope: 'ft_event',
        asset_identifier: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.usdcx-v1::usdcx-token',
        actions: ['burn'],
      } satisfies StacksIfThisFtEvent,
    },
    mainnet: {
      if_this: {
        scope: 'ft_event',
        asset_identifier: 'SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx-v1::usdcx-token',
        actions: ['burn'],
      } satisfies StacksIfThisFtEvent,
    },
  },
};

// ===========================================================================
// 3. STX EVENTS
// No `sender` filter available — filter by sender inside the handler.
// ===========================================================================

export const stxFromContract: StacksPredicate = {
  uuid: UUIDS.stxFromContract,
  name: 'predictstack-stx-from-contract',
  version: 1,
  chain: 'stacks',
  networks: {
    testnet: { if_this: { scope: 'stx_event', actions: ['transfer'] } satisfies StacksIfThisStxEvent },
    mainnet: { if_this: { scope: 'stx_event', actions: ['transfer'] } satisfies StacksIfThisStxEvent },
  },
};

// ===========================================================================
// 4. CONTRACT DEPLOYMENT
// Only `deployer` supported — filter by contract name inside the handler.
// ===========================================================================

export const deployerContracts: StacksPredicate = {
  uuid: UUIDS.deployerContracts,
  name: 'predictstack-pm-deployment',
  version: 1,
  chain: 'stacks',
  networks: {
    testnet: { if_this: { scope: 'contract_deployment', deployer: TESTNET_DEPLOYER } satisfies StacksIfThisContractDeployment },
    mainnet: { if_this: { scope: 'contract_deployment', deployer: MAINNET_DEPLOYER } satisfies StacksIfThisContractDeployment },
  },
};

export const predictionMarketDeployment = deployerContracts;
export const usdcxDeployment            = deployerContracts;

// ===========================================================================
// CONVENIENCE EXPORTS
// ===========================================================================

export const printEventPredicates: StacksPredicate[] = [
  platformInitialized, marketCreated, marketResolved, marketCancelled,
  betPlaced, winningsClaimed, refundClaimed,
  feeUpdated, oracleUpdated, adminUpdated, treasuryUpdated,
  platformPaused, platformUnpaused, minBetUpdated,
];

export const ftEventPredicates: StacksPredicate[]   = [usdcxMint, usdcxTransfer, usdcxBurn];
export const deploymentPredicates: StacksPredicate[] = [deployerContracts];

export const allPredicates: StacksPredicate[] = [
  ...printEventPredicates,
  ...ftEventPredicates,
  stxFromContract,
  ...deploymentPredicates,
];

/**
 * Returns predicates ready to pass to server.start().
 *
 * Two transformations applied:
 *   1. Filter to active network only (testnet or mainnet) — passing both to a
 *      single-network hosted node causes 400 errors.
 *   2. Strip `uuid` — EventObserverPredicate has no uuid field; the observer
 *      manages predicate identity internally via name + network.
 */
export function getActivePredicates(): EventObserverPredicate[] {
  return allPredicates.map(({ uuid: _uuid, ...rest }) => ({
    ...rest,
    networks: { [activeNetwork]: rest.networks[activeNetwork] },
  })) as EventObserverPredicate[];
}