/**
 * Shared formatting utilities for the backend.
 * Centralises number formatting, date helpers, and address display logic.
 */

/**
 * Convert microSTX to STX string with N decimal places.
 * @param {number} micro
 * @param {number} decimals
 * @returns {string}
 */
export function microToStx(micro, decimals = 6) {
  return (Number(micro) / 1_000_000).toFixed(decimals);
}

/**
 * Convert STX to microSTX (integer).
 * @param {number} stx
 * @returns {number}
 */
export function stxToMicro(stx) {
  return Math.round(Number(stx) * 1_000_000);
}

/**
 * Format basis points (0–10000) as a percentage string.
 * @param {number} bps
 * @returns {string} e.g. '55.00%'
 */
export function bpsToPercent(bps, decimals = 2) {
  return `${(Number(bps) / 100).toFixed(decimals)}%`;
}

/**
 * Shorten a STX address for display.
 * @param {string} address
 * @param {number} prefixLen
 * @param {number} suffixLen
 * @returns {string}
 */
export function shortAddress(address, prefixLen = 6, suffixLen = 4) {
  const s = String(address ?? '');
  if (s.length <= prefixLen + suffixLen) return s;
  return `${s.slice(0, prefixLen)}…${s.slice(-suffixLen)}`;
}

/**
 * Convert ISO 8601 string to Unix epoch ms.
 * @param {string} iso
 * @returns {number}
 */
export function isoToMs(iso) {
  return new Date(iso).getTime();
}

/**
 * Return the start of a UTC day as ISO string.
 * @param {Date|string|number} date
 * @returns {string}
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}
