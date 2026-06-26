import { describe, it, expect } from 'vitest';
import { parsePagination, paginatedResponse } from '../middleware/pagination.mjs';

describe('parsePagination', () => {
  function params(obj) {
    return new URLSearchParams(obj);
  }

  it('returns default page 1 and default limit when params are empty', () => {
    const result = parsePagination(params({}));
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.skip).toBe(0);
  });

  it('parses page and limit from params', () => {
    const result = parsePagination(params({ page: '3', limit: '10' }));
    expect(result.page).toBe(3);
    expect(result.limit).toBe(10);
    expect(result.skip).toBe(20);
  });

  it('clamps page to minimum of 1', () => {
    const result = parsePagination(params({ page: '-5' }));
    expect(result.page).toBe(1);
  });

  it('clamps limit to maxLimit', () => {
    const result = parsePagination(params({ limit: '999' }), { maxLimit: 50 });
    expect(result.limit).toBe(50);
  });

  it('clamps limit to minimum of 1', () => {
    const result = parsePagination(params({ limit: '0' }));
    expect(result.limit).toBe(1);
  });

  it('respects custom defaultLimit', () => {
    const result = parsePagination(params({}), { defaultLimit: 5 });
    expect(result.limit).toBe(5);
  });

  it('calculates skip correctly', () => {
    const result = parsePagination(params({ page: '4', limit: '25' }));
    expect(result.skip).toBe(75);
  });
});

describe('paginatedResponse', () => {
  it('wraps items with pagination metadata', () => {
    const result = paginatedResponse(['a', 'b'], 10, 1, 2);
    expect(result.data).toEqual(['a', 'b']);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.totalPages).toBe(5);
    expect(result.pagination.hasNextPage).toBe(true);
    expect(result.pagination.hasPrevPage).toBe(false);
  });

  it('marks hasPrevPage true for page > 1', () => {
    const result = paginatedResponse([], 50, 3, 10);
    expect(result.pagination.hasPrevPage).toBe(true);
  });

  it('marks hasNextPage false on last page', () => {
    const result = paginatedResponse([], 10, 5, 2);
    expect(result.pagination.hasNextPage).toBe(false);
  });

  it('computes correct totalPages', () => {
    expect(paginatedResponse([], 101, 1, 20).pagination.totalPages).toBe(6);
    expect(paginatedResponse([], 20, 1, 20).pagination.totalPages).toBe(1);
    expect(paginatedResponse([], 0, 1, 20).pagination.totalPages).toBe(0);
  });
});
