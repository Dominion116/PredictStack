'use client';

import { useCallback, useReducer } from 'react';

export interface MarketFilters {
  status: string;
  sort: string;
  search: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

const DEFAULT_FILTERS: MarketFilters = {
  status: '',
  sort: 'newest',
  search: '',
  category: '',
  dateFrom: '',
  dateTo: '',
};

type Action =
  | { type: 'SET'; key: keyof MarketFilters; value: string }
  | { type: 'RESET' };

function reducer(state: MarketFilters, action: Action): MarketFilters {
  if (action.type === 'RESET') return DEFAULT_FILTERS;
  return { ...state, [action.key]: action.value };
}

export function useMarketFilters(initial?: Partial<MarketFilters>) {
  const [filters, dispatch] = useReducer(reducer, { ...DEFAULT_FILTERS, ...initial });

  const setFilter = useCallback((key: keyof MarketFilters, value: string) => {
    dispatch({ type: 'SET', key, value });
  }, []);

  const resetFilters = useCallback(() => dispatch({ type: 'RESET' }), []);

  return { filters, setFilter, resetFilters };
}
