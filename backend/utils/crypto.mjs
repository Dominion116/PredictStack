/**
 * Cryptographic utilities for generating tokens and hashes.
 */

import crypto from 'crypto';

/**
 * Generate a random hex string of given length.
 * @param {number} length bytes
 * @returns {string} hex string (2x length)
 */
export function randomHex(length = 16) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * SHA256 hash of a string.
 * @param {string} data
 * @returns {string} hex digest
 */
export function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Simple obfuscation to hide part of a string (e.g., email, address).
 * Shows first and last N chars, obscures the middle.
 * @param {string} str
 * @param {number} showFirst
 * @param {number} showLast
 * @returns {string}
 */
export function obfuscate(str, showFirst = 4, showLast = 4) {
  const s = String(str ?? '');
  if (s.length <= showFirst + showLast) return s;
  const obscured = '*'.repeat(Math.max(1, s.length - showFirst - showLast));
  return `${s.slice(0, showFirst)}${obscured}${s.slice(-showLast)}`;
}
