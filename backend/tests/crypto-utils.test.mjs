import { describe, it, expect } from 'vitest';
import { randomHex, sha256, obfuscate } from '../utils/crypto.mjs';

describe('randomHex', () => {
  it('generates a hex string', () => {
    const hex = randomHex(16);
    expect(hex).toMatch(/^[a-f0-9]+$/);
  });

  it('respects requested length', () => {
    const hex = randomHex(8);
    expect(hex.length).toBe(16); // 8 bytes = 16 hex chars
  });

  it('generates different values on repeated calls', () => {
    const h1 = randomHex(16);
    const h2 = randomHex(16);
    expect(h1).not.toBe(h2);
  });
});

describe('sha256', () => {
  it('hashes a string', () => {
    const hash = sha256('hello');
    expect(hash).toHaveLength(64); // SHA256 = 64 hex chars
  });

  it('returns consistent hash for same input', () => {
    const h1 = sha256('test');
    const h2 = sha256('test');
    expect(h1).toBe(h2);
  });

  it('returns different hash for different input', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });
});

describe('obfuscate', () => {
  it('obfuscates middle of string', () => {
    const result = obfuscate('hello_world', 2, 2);
    expect(result).toMatch(/^he\*+ld$/);
  });

  it('returns original if too short', () => {
    expect(obfuscate('ab')).toBe('ab');
  });

  it('handles null gracefully', () => {
    const result = obfuscate(null);
    expect(result).toBe('');
  });
});
