export async function api(path, options = {}) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
  const res = await fetch(`${API_BASE}${path.startsWith('/api') ? path : `/api${path}`}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(body?.error || body || 'Request failed');
  return body;
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
} 

export async function createGcashCheckout({ amount, description, referenceNumber, cancelUrl, successUrl }) {
  return await api('/payments/gcash/checkout', {
    method: 'POST',
    body: JSON.stringify({ amount, description, referenceNumber, cancelUrl, successUrl })
  });
}