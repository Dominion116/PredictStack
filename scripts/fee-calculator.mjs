#!/usr/bin/env node
/**
 * Calculates platform fee earnings at different bet volumes.
 * Usage: node scripts/fee-calculator.mjs [fee-micro] [num-bets]
 */

const FEE_MICRO = Number(process.argv[2] ?? 10_000);
const NUM_BETS  = Number(process.argv[3] ?? 100);

const STX_PRICE_USD = Number(process.env.STX_PRICE ?? 2);

console.log('\n📊  PredictStack Fee Calculator\n');
console.log(`  Fee per bet : ${FEE_MICRO / 1_000_000} STX (${FEE_MICRO} µSTX)`);
console.log(`  STX price   : $${STX_PRICE_USD}\n`);

const scenarios = [10, 50, 100, 500, 1_000, 5_000, 10_000];

console.log('  Bets     | Total STX    | Total USD');
console.log('  ---------|--------------|----------');

for (const n of scenarios) {
  const stx = (n * FEE_MICRO) / 1_000_000;
  const usd = stx * STX_PRICE_USD;
  console.log(`  ${String(n).padStart(7)}  | ${stx.toFixed(4).padStart(12)}  | $${usd.toFixed(2)}`);
}

const totalStx = (NUM_BETS * FEE_MICRO) / 1_000_000;
const totalUsd = totalStx * STX_PRICE_USD;

console.log(`\n  At ${NUM_BETS} bets: ${totalStx} STX / $${totalUsd.toFixed(2)}\n`);
