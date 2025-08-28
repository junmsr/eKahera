export async function api(path, options = {}) {
  const res = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options,
  });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(body?.error || body || 'Request failed');
  return body;
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
} 