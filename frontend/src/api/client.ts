import { BACKEND_BASE_URL } from '@/lib/constants';

export async function backendFetch<T>(pathname: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_BASE_URL}${pathname}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `Backend request failed with ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json();
}
