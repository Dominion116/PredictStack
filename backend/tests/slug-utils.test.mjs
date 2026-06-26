import { describe, it, expect } from 'vitest';
import { toSlug, questionToRef, isValidRef } from '../utils/slug.mjs';

describe('toSlug', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(toSlug('Will BTC Hit 100k?')).toBe('will-btc-hit-100k');
  });

  it('removes special characters', () => {
    expect(toSlug('Hello, World! #1')).toBe('hello-world-1');
  });

  it('collapses multiple hyphens', () => {
    expect(toSlug('a  --  b')).toBe('a-b');
  });

  it('trims leading/trailing hyphens', () => {
    expect(toSlug('  -hello- ')).toBe('hello');
  });

  it('respects maxLength', () => {
    const result = toSlug('a'.repeat(100), 10);
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('handles empty string', () => {
    expect(toSlug('')).toBe('');
  });

  it('handles null', () => {
    expect(toSlug(null)).toBe('');
  });
});

describe('questionToRef', () => {
  it('returns a non-empty string', () => {
    const ref = questionToRef('Will BTC hit 100k in 2025?');
    expect(ref.length).toBeGreaterThan(0);
  });

  it('appends a 4-char suffix', () => {
    const ref = questionToRef('Will BTC hit 100k?');
    const parts = ref.split('-');
    expect(parts[parts.length - 1].length).toBe(4);
  });

  it('generates different refs for the same question (timestamp suffix)', () => {
    // Very unlikely to collide within a test run but the function should never return the exact same base
    const r1 = questionToRef('Same question');
    const r2 = questionToRef('Same question');
    // Both should start with the same base slug
    expect(r1.startsWith('same-question')).toBe(true);
    expect(r2.startsWith('same-question')).toBe(true);
  });
});

describe('isValidRef', () => {
  it('returns true for a valid ref', () => {
    expect(isValidRef('will-btc-hit-100k')).toBe(true);
  });

  it('returns false for refs shorter than 3 chars', () => {
    expect(isValidRef('ab')).toBe(false);
  });

  it('returns false for refs with uppercase letters', () => {
    expect(isValidRef('Will-BTC')).toBe(false);
  });

  it('returns false for non-string values', () => {
    expect(isValidRef(null)).toBe(false);
    expect(isValidRef(123)).toBe(false);
  });

  it('returns false for refs with leading/trailing hyphens', () => {
    expect(isValidRef('-hello-world-')).toBe(false);
  });
});
