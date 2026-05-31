'use client';

import { useEffect, useState } from 'react';
import { NETWORK_ENV } from '@/lib/constants';

const API_BASE = NETWORK_ENV === 'mainnet'
  ? 'https://api.hiro.so'
  : 'https://api.testnet.hiro.so';

// Module-level cache: address → resolved name (or null = no BNS name)
const cache = new Map<string, string | null>();

async function resolveBnsName(address: string): Promise<string | null> {
  if (cache.has(address)) return cache.get(address)!;

  try {
    const res = await fetch(`${API_BASE}/v1/addresses/stacks/${address}`);
    if (!res.ok) { cache.set(address, null); return null; }
    const data: { names?: string[] } = await res.json();
    const name = data.names?.[0] ?? null;
    cache.set(address, name);
    return name;
  } catch {
    cache.set(address, null);
    return null;
  }
}

/**
 * Resolves a Stacks address to its primary BNS name (e.g. "satoshi.btc").
 * Returns null while loading or when no name is registered.
 */
export function useBnsName(address: string | null | undefined): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) { setName(null); return; }
    // Serve from cache synchronously when available
    if (cache.has(address)) { setName(cache.get(address)!); return; }
    void resolveBnsName(address).then(setName);
  }, [address]);

  return name;
}

/**
 * Resolves multiple addresses in parallel and returns a map of address → BNS name.
 * Used by list views (leaderboard) to batch lookups.
 */
export function useBnsNames(addresses: string[]): Map<string, string> {
  const [names, setNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!addresses.length) return;
    const unique = [...new Set(addresses)];
    Promise.all(unique.map(a => resolveBnsName(a).then(n => [a, n] as const)))
      .then(pairs => {
        setNames(new Map(pairs.filter((p): p is [string, string] => p[1] !== null)));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.join(',')]);

  return names;
}
