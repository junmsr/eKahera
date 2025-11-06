export async function api(path, options = {}, returnRawResponse = false) {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const headers = { ...(options.headers || {}) };
  // Let the browser set the Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path.startsWith('/api') ? path : `/api${path}`}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => res.text());
    throw new Error(errorBody?.error || errorBody || 'Request failed');
  }

  if (returnRawResponse) {
    return res;
  }

  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? res.json() : res.text();
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