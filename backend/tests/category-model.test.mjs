import { describe, it, expect } from 'vitest';
import { CATEGORIES, DEFAULT_CATEGORY, isValidCategory } from '../models/category.mjs';

describe('CATEGORIES', () => {
  it('is a frozen array', () => {
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
    expect(Array.isArray(CATEGORIES)).toBe(true);
  });

  it('contains expected canonical categories', () => {
    expect(CATEGORIES).toContain('Crypto');
    expect(CATEGORIES).toContain('Politics');
    expect(CATEGORIES).toContain('Sports');
    expect(CATEGORIES).toContain('Science');
    expect(CATEGORIES).toContain('Entertainment');
    expect(CATEGORIES).toContain('Technology');
    expect(CATEGORIES).toContain('Finance');
    expect(CATEGORIES).toContain('Other');
  });

  it('has at least 8 categories', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(8);
  });
});

describe('DEFAULT_CATEGORY', () => {
  it('is a non-empty string', () => {
    expect(typeof DEFAULT_CATEGORY).toBe('string');
    expect(DEFAULT_CATEGORY.length).toBeGreaterThan(0);
  });

  it('is itself a valid category', () => {
    expect(isValidCategory(DEFAULT_CATEGORY)).toBe(true);
  });
});

describe('isValidCategory', () => {
  it('returns true for all canonical categories', () => {
    for (const cat of CATEGORIES) {
      expect(isValidCategory(cat)).toBe(true);
    }
  });

  it('returns false for unknown categories', () => {
    expect(isValidCategory('Gambling')).toBe(false);
    expect(isValidCategory('')).toBe(false);
    expect(isValidCategory('crypto')).toBe(false); // case-sensitive
  });

  it('returns false for null/undefined', () => {
    expect(isValidCategory(null)).toBe(false);
    expect(isValidCategory(undefined)).toBe(false);
  });
});
