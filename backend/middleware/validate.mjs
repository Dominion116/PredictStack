import { sendJson } from './http.mjs';

/**
 * Shared validation utilities for route handlers.
 * Return { ok: false, error } to signal failure; the caller should call sendJson.
 */

export function requireFields(obj, ...fields) {
  for (const field of fields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      return { ok: false, error: `${field} is required` };
    }
  }
  return { ok: true };
}

export function requirePositiveNumber(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: `${name} must be a positive number` };
  }
  return { ok: true, value: n };
}

export function requireAddress(address, name = 'address') {
  const s = String(address ?? '').trim();
  if (!s || s.length < 5) return { ok: false, error: `${name} is required and must be a valid STX address` };
  return { ok: true, value: s };
}

export function requireEnum(value, allowed, name) {
  if (!allowed.includes(value)) {
    return { ok: false, error: `${name} must be one of: ${allowed.join(', ')}` };
  }
  return { ok: true };
}

export function requireStringLength(value, name, { min = 1, max = 1000 } = {}) {
  const s = String(value ?? '').trim();
  if (s.length < min) return { ok: false, error: `${name} must be at least ${min} character(s)` };
  if (s.length > max) return { ok: false, error: `${name} must be at most ${max} characters` };
  return { ok: true, value: s };
}

/**
 * Convenience: sends 400 and returns true if validation fails.
 * Usage: if (rejectInvalid(res, requireFields(body, 'address'))) return;
 */
export function rejectInvalid(res, result) {
  if (!result.ok) {
    sendJson(res, 400, { error: result.error });
    return true;
  }
  return false;
}
