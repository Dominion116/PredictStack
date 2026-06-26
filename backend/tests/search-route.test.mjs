import { describe, it, expect } from 'vitest';
import { createSearchRoutes } from '../routes/search.mjs';

function makeStore(markets = {}) {
  return { getState: () => ({ markets }) };
}

function makeSearchParams(q, limit) {
  const p = new URLSearchParams();
  if (q !== undefined) p.set('q', q);
  if (limit !== undefined) p.set('limit', String(limit));
  return p;
}

function makeRes() {
  const res = { statusCode: null, body: null };
  res.writeHead = (code) => { res.statusCode = code; };
  res.end = (data) => { res.body = JSON.parse(data); };
  return res;
}

describe('search route', () => {
  const store = makeStore({
    'btc-100k': { id: 'btc-100k', contractMarketId: 1, question: 'Will BTC hit $100k?', description: 'Bitcoin price prediction', category: 'Crypto', tags: ['btc', 'bitcoin'] },
    'eth-flip': { id: 'eth-flip', contractMarketId: 2, question: 'Will ETH flip BTC in 2025?', description: 'Ethereum vs Bitcoin marketcap', category: 'Crypto', tags: ['eth'] },
    'superbowl': { id: 'superbowl', contractMarketId: 3, question: 'Who wins the Super Bowl?', description: 'NFL Championship', category: 'Sports', tags: ['nfl'] },
  });

  const { search, suggest } = createSearchRoutes({ store });

  it('returns 400 when q is missing', () => {
    const res = makeRes();
    search({}, res, makeSearchParams(undefined));
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns matching markets for a keyword', () => {
    const res = makeRes();
    search({}, res, makeSearchParams('btc'));
    expect(res.statusCode).toBe(200);
    expect(res.body.markets.length).toBeGreaterThan(0);
    expect(res.body.markets.some(m => m.id === 'btc-100k')).toBe(true);
  });

  it('scores question matches higher than description matches', () => {
    const res = makeRes();
    search({}, res, makeSearchParams('btc'));
    const markets = res.body.markets;
    const btcIdx = markets.findIndex(m => m.id === 'btc-100k');
    const ethIdx = markets.findIndex(m => m.id === 'eth-flip');
    if (ethIdx !== -1) expect(btcIdx).toBeLessThan(ethIdx);
  });

  it('returns empty array for unmatched query', () => {
    const res = makeRes();
    search({}, res, makeSearchParams('zzznomatch'));
    expect(res.body.markets).toEqual([]);
  });

  it('respects limit param', () => {
    const res = makeRes();
    search({}, res, makeSearchParams('will', 1));
    expect(res.body.markets.length).toBeLessThanOrEqual(1);
  });

  it('caps limit at 50', () => {
    const res = makeRes();
    search({}, res, makeSearchParams('will', 999));
    expect(res.body.markets.length).toBeLessThanOrEqual(50);
  });
});

describe('suggest route', () => {
  const store = makeStore({
    'btc-100k': { id: 'btc-100k', question: 'Will BTC hit $100k?' },
    'eth-flip': { id: 'eth-flip', question: 'Will ETH flip BTC?' },
  });

  const { suggest } = createSearchRoutes({ store });

  it('returns empty for query shorter than 2 chars', () => {
    const res = makeRes();
    suggest({}, res, makeSearchParams('b'));
    expect(res.body.suggestions).toEqual([]);
  });

  it('returns matching suggestions', () => {
    const res = makeRes();
    suggest({}, res, makeSearchParams('btc'));
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('returns at most 5 suggestions', () => {
    const res = makeRes();
    suggest({}, res, makeSearchParams('will'));
    expect(res.body.suggestions.length).toBeLessThanOrEqual(5);
  });
});
