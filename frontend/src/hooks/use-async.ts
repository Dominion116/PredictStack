'use client';

import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic hook for async operations with loading/error state.
 * Useful for mutation-style operations (post, delete) rather than data fetching.
 *
 * @example
 * const { execute, loading, error } = useAsync(postComment);
 * await execute(marketId, address, body);
 */
export function useAsync<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
) {
  const [state, setState] = useState<AsyncState<TResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const result = await fn(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err: any) {
        setState({ data: null, loading: false, error: err.message ?? 'An error occurred' });
        return null;
      }
    },
    [fn],
  );

  return { ...state, execute };
}
