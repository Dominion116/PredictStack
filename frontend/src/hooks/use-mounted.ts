'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true once the component is mounted on the client.
 * Useful to avoid hydration mismatches when conditionally rendering client-only content.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
