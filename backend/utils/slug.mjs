/**
 * Slug generation utilities for market references and URL-safe identifiers.
 */

/**
 * Convert arbitrary text to a URL-safe lowercase slug.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string}
 */
export function toSlug(text, maxLength = 64) {
  return String(text ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLength);
}

/**
 * Generate a market reference slug from a question string.
 * Appends a short timestamp suffix to ensure uniqueness.
 * @param {string} question
 * @returns {string}
 */
export function questionToRef(question) {
  const base = toSlug(question, 50);
  const suffix = Date.now().toString(36).slice(-4);
  return base ? `${base}-${suffix}` : suffix;
}

/**
 * Check if a string is a valid market ref (alphanumeric + hyphens, 3–64 chars).
 * @param {string} ref
 * @returns {boolean}
 */
export function isValidRef(ref) {
  return typeof ref === 'string' && /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(ref);
}
