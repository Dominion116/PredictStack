import { describe, it, expect } from 'vitest';
import { setCorsHeaders, handlePreflight } from '../middleware/cors.mjs';

function makeMockRes() {
  const headers = {};
  return {
    headers,
    statusCode: null,
    setHeader: (key, value) => { headers[key] = value; },
    writeHead: (code) => { this.statusCode = code; },
    end: () => {},
  };
}

function makeMockReq(method = 'GET', origin = 'http://localhost:3000') {
  return { method, headers: { origin } };
}

describe('setCorsHeaders', () => {
  it('sets CORS headers for allowed origin', () => {
    const res = makeMockRes();
    setCorsHeaders(res, 'http://localhost:3000');
    expect(res.headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    expect(res.headers['Access-Control-Allow-Methods']).toMatch(/GET/);
  });

  it('allows all origins in development', () => {
    process.env.NODE_ENV = 'development';
    const res = makeMockRes();
    setCorsHeaders(res, 'https://random.com');
    expect(res.headers['Access-Control-Allow-Origin']).toBe('https://random.com');
  });
});

describe('handlePreflight', () => {
  it('returns true for OPTIONS requests', () => {
    const req = makeMockReq('OPTIONS');
    const res = makeMockRes();
    expect(handlePreflight(req, res)).toBe(true);
  });

  it('returns false for non-OPTIONS requests', () => {
    const req = makeMockReq('GET');
    const res = makeMockRes();
    expect(handlePreflight(req, res)).toBe(false);
  });
});
