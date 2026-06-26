/**
 * Pagination helpers for route handlers.
 * Provides consistent page/limit extraction and response shaping.
 */

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Extract and validate page + limit from URLSearchParams.
 * @param {URLSearchParams} searchParams
 * @param {object} options
 * @returns {{ page: number, limit: number, skip: number }}
 */
export function parsePagination(searchParams, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) {
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(maxLimit, Math.max(1, Number(searchParams.get('limit') || defaultLimit)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Wrap paginated data into a consistent response shape.
 * @param {Array} items
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {object}
 */
export function paginatedResponse(items, total, page, limit) {
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
}
