/**
 * Shared API utilities and helpers.
 */

import { BACKEND_BASE_URL } from '@/lib/constants';

/**
 * Build a full API URL from a path.
 */
export function apiUrl(path: string): string {
  return `${BACKEND_BASE_URL}${path}`;
}

/**
 * Build query string from object.
 */
export function buildQuery(params: Record<string, any>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined && value !== '') {
      sp.set(key, String(value));
    }
  }
  return sp.toString();
}

/**
 * Make a paginated API call.
 */
export async function fetchPaginated<T>(
  url: string,
  page = 1,
  limit = 20,
): Promise<{ data: T[]; total: number; page: number; limit: number }> {
  const qs = buildQuery({ page, limit });
  const res = await fetch(`${url}?${qs}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
