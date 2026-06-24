import { backendFetch } from './client';

export interface Category {
  name: string;
  count: number;
}

export async function getCategories(): Promise<{ categories: Category[] }> {
  return backendFetch<{ categories: Category[] }>('/api/categories');
}
