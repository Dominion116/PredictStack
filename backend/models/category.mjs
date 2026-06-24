/**
 * Canonical category list for PredictStack markets.
 * Used for validation on create, and served via GET /api/categories.
 */

export const CATEGORIES = Object.freeze([
  'Crypto',
  'Politics',
  'Sports',
  'Science',
  'Entertainment',
  'Technology',
  'Finance',
  'Other',
]);

export const DEFAULT_CATEGORY = 'Other';

export function isValidCategory(cat) {
  return CATEGORIES.includes(String(cat));
}
