import { buildSnapshot } from '../models/price-snapshot.mjs';

let _col = null;
let _store = null;
let _timer = null;

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function initPriceSnapshotCron(col, store) {
  _col = col;
  _store = store;
  _timer = setInterval(takeSnapshots, INTERVAL_MS);
  console.log('[price-snapshot-cron] started — interval 5 min');
}

export function stopPriceSnapshotCron() {
  if (_timer) clearInterval(_timer);
}

async function takeSnapshots() {
  if (!_col || !_store) return;
  const state = _store.getState();
  const activeMarkets = Object.values(state.markets ?? {}).filter(m => m.status === 'active');
  if (!activeMarkets.length) return;

  const docs = activeMarkets.map(m => {
    const yes = state.yesOdds?.[m.contractMarketId] ?? computeOdds(m, true);
    const no = 10_000 - yes;
    return buildSnapshot(m.contractMarketId, yes, no);
  });

  try {
    await _col.insertMany(docs);
  } catch (err) {
    console.error('[price-snapshot-cron] insertMany failed:', err.message);
  }
}

function computeOdds(market, forYes) {
  const yes = market.yesPoolMicro ?? 0;
  const no = market.noPoolMicro ?? 0;
  const total = yes + no;
  if (!total) return 5_000;
  return Math.floor(((forYes ? yes : no) / total) * 10_000);
}
