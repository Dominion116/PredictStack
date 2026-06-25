'use client';

import { useEffect, useState } from 'react';

export interface StacksTx {
  tx_id: string;
  tx_type: string;
  tx_status: string;
  burn_block_time_iso: string;
  fee_rate: string;
}

async function fetchTransactions(
  address: string,
  network: 'mainnet' | 'testnet',
): Promise<StacksTx[]> {
  const base = network === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';
  const res = await fetch(`${base}/extended/v1/address/${address}/transactions?limit=10`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export function useTransactions(
  address: string | null | undefined,
  network: 'mainnet' | 'testnet' = 'mainnet',
) {
  const [transactions, setTransactions] = useState<StacksTx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetchTransactions(address, network)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [address, network]);

  return { transactions, loading };
}
