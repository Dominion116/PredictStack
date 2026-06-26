import { describe, it, expect, vi } from 'vitest';
import { requireFields, requirePositiveNumber, requireAddress, requireEnum, requireStringLength, rejectInvalid } from '../middleware/validate.mjs';

describe('requireFields', () => {
  it('returns ok when all fields are present', () => {
    expect(requireFields({ a: 1, b: 'x' }, 'a', 'b').ok).toBe(true);
  });

  it('fails on missing field', () => {
    const r = requireFields({ a: 1 }, 'a', 'b');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/b is required/i);
  });

  it('fails on empty string', () => {
    const r = requireFields({ a: '' }, 'a');
    expect(r.ok).toBe(false);
  });

  it('fails on null value', () => {
    const r = requireFields({ a: null }, 'a');
    expect(r.ok).toBe(false);
  });
});

describe('requirePositiveNumber', () => {
  it('returns ok and coerced value for valid number', () => {
    const r = requirePositiveNumber('50000', 'amount');
    expect(r.ok).toBe(true);
    expect(r.value).toBe(50000);
  });

  it('fails for zero', () => {
    expect(requirePositiveNumber(0, 'amount').ok).toBe(false);
  });

  it('fails for negative number', () => {
    expect(requirePositiveNumber(-1, 'amount').ok).toBe(false);
  });

  it('fails for NaN', () => {
    expect(requirePositiveNumber('abc', 'amount').ok).toBe(false);
  });
});

describe('requireAddress', () => {
  it('returns ok for a valid-looking address', () => {
    const r = requireAddress('SP1ABC123XYZ');
    expect(r.ok).toBe(true);
    expect(r.value).toBe('SP1ABC123XYZ');
  });

  it('fails for empty string', () => {
    expect(requireAddress('').ok).toBe(false);
  });

  it('fails for null', () => {
    expect(requireAddress(null).ok).toBe(false);
  });

  it('trims whitespace', () => {
    const r = requireAddress('  SP1ABC  ');
    expect(r.value).toBe('SP1ABC');
  });
});

describe('requireEnum', () => {
  it('passes for valid value', () => {
    expect(requireEnum('active', ['active', 'resolved'], 'status').ok).toBe(true);
  });

  it('fails for value not in list', () => {
    const r = requireEnum('pending', ['active', 'resolved'], 'status');
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/active, resolved/);
  });
});

describe('requireStringLength', () => {
  it('passes for valid length', () => {
    const r = requireStringLength('hello', 'name', { min: 1, max: 10 });
    expect(r.ok).toBe(true);
    expect(r.value).toBe('hello');
  });

  it('fails when too short', () => {
    expect(requireStringLength('', 'name', { min: 1 }).ok).toBe(false);
  });

  it('fails when too long', () => {
    expect(requireStringLength('x'.repeat(11), 'name', { max: 10 }).ok).toBe(false);
  });

  it('trims before checking length', () => {
    const r = requireStringLength('  hi  ', 'name', { min: 2 });
    expect(r.ok).toBe(true);
    expect(r.value).toBe('hi');
  });
});

describe('rejectInvalid', () => {
  it('calls sendJson and returns true when result is not ok', () => {
    const res = { statusCode: null, body: null };
    res.writeHead = (code) => { res.statusCode = code; };
    res.end = (data) => { res.body = JSON.parse(data); };
    const rejected = rejectInvalid(res, { ok: false, error: 'test error' });
    expect(rejected).toBe(true);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('test error');
  });

  it('returns false and does nothing when result is ok', () => {
    const res = {};
    const rejected = rejectInvalid(res, { ok: true });
    expect(rejected).toBe(false);
  });
});
