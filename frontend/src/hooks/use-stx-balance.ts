'use client';

import { useEffect, useState } from 'react';

const POLL_INTERVAL_MS = 60_000;

async function fetchBalance(address: string, network: 'mainnet' | 'testnet'): Promise<number> {
  const base = network === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';
  const res = await fetch(`${base}/v2/accounts/${address}?proof=0`);
  if (!res.ok) throw new Error('Failed to fetch balance');
  const data = await res.json();
  return Number(data.balance) / 1_000_000;
}

export function useStxBalance(address: string | null | undefined, network: 'mainnet' | 'testnet' = 'mainnet') {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const bal = await fetchBalance(address!, network);
        if (!cancelled) setBalance(bal);
      } catch {
        // silently ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, POLL_INTERVAL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [address, network]);

  return { balance, loading };
}
