// helper function to make authenticated API requests to the backend. 

import { getAuth0Client } from '@/lib/auth0';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const auth0 = await getAuth0Client();


  const token = await auth0.getTokenSilently();

  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) throw new Error('Missing EXPO_PUBLIC_API_BASE_URL in .env');

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

