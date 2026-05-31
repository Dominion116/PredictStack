'use client';

import { useEffect, useState } from 'react';
import { resolveZoneFileToPerson } from '@stacks/profile';
import { NETWORK_ENV } from '@/lib/constants';

const API_BASE = NETWORK_ENV === 'mainnet'
  ? 'https://api.hiro.so'
  : 'https://api.testnet.hiro.so';

export interface StacksProfile {
  displayName: string | null;
  avatarUrl: string | null;
}

// Module-level cache so we don't re-fetch across re-renders
const profileCache = new Map<string, StacksProfile | null>();

async function fetchStacksProfile(address: string): Promise<StacksProfile | null> {
  if (profileCache.has(address)) return profileCache.get(address)!;

  try {
    // Step 1: get primary BNS name for the address
    const nameRes = await fetch(`${API_BASE}/v1/addresses/stacks/${address}`);
    if (!nameRes.ok) { profileCache.set(address, null); return null; }
    const nameData: { names?: string[] } = await nameRes.json();
    const name = nameData.names?.[0];
    if (!name) { profileCache.set(address, null); return null; }

    // Step 2: get zone file for that name
    const zoneRes = await fetch(`${API_BASE}/v1/names/${encodeURIComponent(name)}`);
    if (!zoneRes.ok) { profileCache.set(address, null); return null; }
    const zoneData: { zonefile?: string } = await zoneRes.json();
    if (!zoneData.zonefile) { profileCache.set(address, null); return null; }

    // Step 3: resolve zone file to a Person profile via @stacks/profile
    const profile = await new Promise<any>((resolve) => {
      resolveZoneFileToPerson(zoneData.zonefile, address, (p: any) => resolve(p ?? null));
    });

    if (!profile) { profileCache.set(address, null); return null; }

    const result: StacksProfile = {
      displayName: (profile.name as string | undefined) ?? null,
      avatarUrl:   (profile.image as Array<{ contentUrl?: string }> | undefined)?.[0]?.contentUrl ?? null,
    };

    profileCache.set(address, result);
    return result;
  } catch {
    profileCache.set(address, null);
    return null;
  }
}

/**
 * Fetches the public Stacks profile for a given address using @stacks/profile.
 * Resolves via BNS name → zone file → Person token → { displayName, avatarUrl }.
 * Returns null for each field while loading or when no profile exists.
 */
export function useProfile(address: string | null | undefined): StacksProfile & { loading: boolean } {
  const [profile, setProfile]   = useState<StacksProfile>({ displayName: null, avatarUrl: null });
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (!address) { setProfile({ displayName: null, avatarUrl: null }); return; }

    if (profileCache.has(address)) {
      setProfile(profileCache.get(address) ?? { displayName: null, avatarUrl: null });
      return;
    }

    setLoading(true);
    fetchStacksProfile(address)
      .then(p => setProfile(p ?? { displayName: null, avatarUrl: null }))
      .finally(() => setLoading(false));
  }, [address]);

  return { ...profile, loading };
}

/**
 * Batch-fetches profiles for multiple addresses.
 * Returns a Map of address → StacksProfile for addresses that have a profile.
 */
export function useProfiles(addresses: string[]): Map<string, StacksProfile> {
  const [profiles, setProfiles] = useState<Map<string, StacksProfile>>(new Map());

  useEffect(() => {
    if (!addresses.length) return;
    const unique = [...new Set(addresses)];
    Promise.all(unique.map(a => fetchStacksProfile(a).then(p => [a, p] as const)))
      .then(pairs => {
        setProfiles(new Map(
          pairs.filter((p): p is [string, StacksProfile] => p[1] !== null)
        ));
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.join(',')]);

  return profiles;
}
