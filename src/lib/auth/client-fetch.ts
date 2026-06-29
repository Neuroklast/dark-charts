import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import { asyncStorage } from '@/lib/storage/asyncStorage';

export async function getClientAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {};

  try {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
      return headers;
    }
  } catch {
    // Fall back to legacy JWT storage
  }

  const legacyToken = await asyncStorage.get<string>('auth-token');
  if (legacyToken) {
    headers.Authorization = `Bearer ${legacyToken}`;
  }

  return headers;
}

export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const authHeaders = await getClientAuthHeaders();
  const headers = new Headers(init?.headers);

  for (const [key, value] of Object.entries(authHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: init?.credentials ?? 'include',
  });
}