'use client';

import { useEffect, useState } from 'react';
import { getCategories, Category } from '@/api/categories';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategories()
      .then(data => setCategories(data.categories))
      .catch((err: any) => setError(err.message ?? 'Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading, error };
}
