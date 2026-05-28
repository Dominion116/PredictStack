#!/usr/bin/env node
/**
 * Lists markets from the backend API.
 * Usage: BACKEND_URL=http://localhost:4000 node scripts/list-markets.mjs [--status active]
 */

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000';

const args = process.argv.slice(2);
const statusIdx = args.indexOf('--status');
const status = statusIdx !== -1 ? args[statusIdx + 1] : '';
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? args[limitIdx + 1] : '20';

const params = new URLSearchParams({ limit });
if (status) params.set('status', status);

const url = `${BACKEND_URL}/api/markets?${params}`;
console.log(`\nFetching: ${url}\n`);

try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { markets } = await res.json();

  if (!markets?.length) {
    console.log('No markets found.');
    process.exit(0);
  }

  console.log(`Found ${markets.length} market(s):\n`);
  for (const m of markets) {
    const pool = ((m.yesPoolMicro ?? 0) + (m.noPoolMicro ?? 0)) / 1_000_000;
    console.log(`  #${m.contractMarketId ?? '?'} [${(m.status ?? '').toUpperCase()}] ${m.question}`);
    console.log(`     Pool: ${pool.toFixed(4)} STX  |  Bets: ${m.totalBets ?? 0}  |  Ref: ${m.marketRef ?? '-'}\n`);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
