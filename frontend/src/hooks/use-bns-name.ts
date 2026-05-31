'use client';

import { useEffect, useState } from 'react';
import { BNS_CONTRACT_NAME } from '@stacks/bns';
import { NETWORK_ENV } from '@/lib/constants';

// BNS_CONTRACT_NAME = "bns" — the on-chain contract powering all lookups below.
export { BNS_CONTRACT_NAME };

const API_BASE = NETWORK_ENV === 'mainnet'
  ? 'https://api.hiro.so'
  : 'https://api.testnet.hiro.so';

// ── reverse lookup cache: address → BNS name ──────────────────────────────
const reverseCache = new Map<string, string | null>();

async function resolveBnsName(address: string): Promise<string | null> {
  if (reverseCache.has(address)) return reverseCache.get(address)!;
  try {
    const res = await fetch(`${API_BASE}/v1/addresses/stacks/${address}`);
    if (!res.ok) { reverseCache.set(address, null); return null; }
    const data: { names?: string[] } = await res.json();
    const name = data.names?.[0] ?? null;
    reverseCache.set(address, name);
    return name;
  } catch {
    reverseCache.set(address, null);
    return null;
  }
}

// ── forward lookup cache: BNS name → address ──────────────────────────────
const forwardCache = new Map<string, string | null>();

async function resolveBnsAddress(name: string): Promise<string | null> {
  const key = name.toLowerCase();
  if (forwardCache.has(key)) return forwardCache.get(key)!;
  try {
    const res = await fetch(`${API_BASE}/v1/names/${encodeURIComponent(key)}`);
    if (!res.ok) { forwardCache.set(key, null); return null; }
    const data: { address?: string } = await res.json();
    const address = data.address ?? null;
    forwardCache.set(key, address);
    return address;
  } catch {
    forwardCache.set(key, null);
    return null;
  }
}

// ── hooks ─────────────────────────────────────────────────────────────────

/**
 * Resolves a Stacks address to its primary BNS name (e.g. "satoshi.btc").
 * Returns null while loading or when no name is registered.
 */
export function useBnsName(address: string | null | undefined): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    if (!address) { setName(null); return; }
    if (reverseCache.has(address)) { setName(reverseCache.get(address)!); return; }
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

/**
 * Resolves a BNS name to its owner's Stacks address (forward lookup).
 * Returns null while loading or when the name is not registered.
 */
export function useBnsAddress(name: string | null | undefined): {
  address: string | null;
  loading: boolean;
} {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = name?.trim().toLowerCase() ?? '';
    if (!trimmed) { setAddress(null); return; }

    const key = trimmed;
    if (forwardCache.has(key)) { setAddress(forwardCache.get(key)!); return; }

    setLoading(true);
    void resolveBnsAddress(trimmed)
      .then(setAddress)
      .finally(() => setLoading(false));
  }, [name]);

  return { address, loading };
}
