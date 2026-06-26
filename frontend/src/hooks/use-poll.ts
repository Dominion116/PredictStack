'use client';

import { useEffect, useRef } from 'react';

/**
 * Runs a callback immediately and then on a fixed interval.
 * Automatically clears the interval when the component unmounts or deps change.
 *
 * @param callback - async or sync function to call
 * @param intervalMs - polling interval in milliseconds
 * @param enabled - set to false to pause polling (default true)
 */
export function usePoll(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const run = () => callbackRef.current();
    run(); // immediate first call

    const id = setInterval(run, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
