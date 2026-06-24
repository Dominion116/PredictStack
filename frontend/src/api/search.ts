import { backendFetch } from './client';

export interface SearchSuggestion {
  id: string;
  question: string;
}

export interface SearchResult {
  id: string;
  marketRef: string;
  question: string;
  description: string;
  category: string;
  status: string;
  contractMarketId: number;
}

export async function searchMarkets(q: string, limit = 20): Promise<{ markets: SearchResult[]; query: string }> {
  return backendFetch<{ markets: SearchResult[]; query: string }>(
    `/api/markets/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
}

export async function suggestMarkets(q: string): Promise<{ suggestions: SearchSuggestion[] }> {
  return backendFetch<{ suggestions: SearchSuggestion[] }>(
    `/api/markets/suggest?q=${encodeURIComponent(q)}`,
  );
}
