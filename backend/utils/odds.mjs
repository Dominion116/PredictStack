/**
 * AMM odds calculation utilities used across the platform.
 * All odds are expressed in basis points (0–10000).
 */

/**
 * Compute YES/NO odds from pool sizes.
 * @param {number} yesPoolMicro
 * @param {number} noPoolMicro
 * @returns {{ yes: number, no: number }} odds in basis points
 */
export function computeOdds(yesPoolMicro, noPoolMicro) {
  const total = Number(yesPoolMicro) + Number(noPoolMicro);
  if (total === 0) return { yes: 5000, no: 5000 };
  const yes = Math.floor((Number(yesPoolMicro) / total) * 10_000);
  return { yes, no: 10_000 - yes };
}

/**
 * Estimate post-trade odds after a new bet is placed.
 * @param {number} yesPoolMicro current pool
 * @param {number} noPoolMicro current pool
 * @param {boolean} outcome true = YES bet, false = NO bet
 * @param {number} amountMicro size of incoming bet
 * @returns {{ yes: number, no: number }}
 */
export function estimatePostTradeOdds(yesPoolMicro, noPoolMicro, outcome, amountMicro) {
  const newYes = outcome ? Number(yesPoolMicro) + Number(amountMicro) : Number(yesPoolMicro);
  const newNo  = outcome ? Number(noPoolMicro) : Number(noPoolMicro) + Number(amountMicro);
  return computeOdds(newYes, newNo);
}

/**
 * Compute implied probability from basis-point odds.
 * @param {number} bps odds in basis points
 * @returns {number} probability between 0 and 1
 */
export function bpsToProb(bps) {
  return Number(bps) / 10_000;
}

/**
 * Estimate slippage as the delta between pre-trade and post-trade price in bps.
 * @param {number} yesPoolMicro
 * @param {number} noPoolMicro
 * @param {boolean} outcome
 * @param {number} amountMicro
 * @returns {number} slippage in basis points (always >= 0)
 */
export function estimateSlippage(yesPoolMicro, noPoolMicro, outcome, amountMicro) {
  const pre  = computeOdds(yesPoolMicro, noPoolMicro);
  const post = estimatePostTradeOdds(yesPoolMicro, noPoolMicro, outcome, amountMicro);
  const preOdds  = outcome ? pre.yes  : pre.no;
  const postOdds = outcome ? post.yes : post.no;
  return Math.max(0, postOdds - preOdds);
}
