'use client';

import { useEffect, useState } from 'react';
import { StackingClient } from '@stacks/stacking';
import { STACKS_MAINNET, STACKS_TESTNET } from '@stacks/network';
import { NETWORK_ENV } from '@/lib/constants';
import type { StackerInfo, V2PoxInfoResponse } from '@stacks/stacking';

const network = NETWORK_ENV === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;

export interface StackingStatus {
  stackerInfo: StackerInfo | null;
  poxInfo: V2PoxInfoResponse | null;
  lockedMicroStx: bigint | null;
  secondsUntilNextCycle: number | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches PoX info and the connected user's stacking status.
 * Pass null for address to fetch only the global PoX data.
 */
export function useStacking(address: string | null | undefined): StackingStatus {
  const [stackerInfo, setStackerInfo]             = useState<StackerInfo | null>(null);
  const [poxInfo, setPoxInfo]                     = useState<V2PoxInfoResponse | null>(null);
  const [lockedMicroStx, setLockedMicroStx]       = useState<bigint | null>(null);
  const [secondsUntilNextCycle, setSeconds]       = useState<number | null>(null);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Use a placeholder address for unauthenticated PoX-only queries
    const queryAddress = address ?? (NETWORK_ENV === 'mainnet'
      ? 'SP000000000000000000002Q6VF78'
      : 'ST000000000000000000002AMW42H');

    const client = new StackingClient({ address: queryAddress, network });

    const tasks: Promise<unknown>[] = [
      client.getPoxInfo().then(setPoxInfo),
      client.getSecondsUntilNextCycle().then(setSeconds),
    ];

    if (address) {
      tasks.push(
        client.getStatus().then(setStackerInfo),
        client.getAccountExtendedBalances().then(bal => {
          setLockedMicroStx(BigInt(bal.stx.locked));
        }),
      );
    }

    Promise.all(tasks)
      .catch(err => {
        console.error('Stacking data fetch failed:', err);
        setError('Failed to load stacking data');
      })
      .finally(() => setLoading(false));
  }, [address]);

  return { stackerInfo, poxInfo, lockedMicroStx, secondsUntilNextCycle, loading, error };
}
