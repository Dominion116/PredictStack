'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to set a timeout with automatic cleanup.
 * @param callback Function to call after delay
 * @param delayMs Delay in milliseconds
 */
export function useTimeout(callback: () => void, delayMs: number | null) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (delayMs === null) return;
    const id = setTimeout(() => callbackRef.current(), delayMs);
    return () => clearTimeout(id);
  }, [delayMs]);
}
