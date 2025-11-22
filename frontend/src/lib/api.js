export async function api(path, options = {}, returnRawResponse = false) {
  const RENDER_URL = 'https://ekahera.onrender.com';
  const LOCAL_DEFAULT = 'http://localhost:5000';
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const API_BASE = envUrl || (import.meta.env.DEV || isLocalHost ? LOCAL_DEFAULT : RENDER_URL);

  const headers = { ...(options.headers || {}) };
  // Let the browser set the Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Get token from sessionStorage first, then localStorage
  const token = sessionStorage.getItem('auth_token') || localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const finalUrl = API_BASE + (path.startsWith('/api') ? path : `/api${path}`);
  const res = await fetch(finalUrl, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson?.error || errorText || 'Request failed');
    } catch (e) {
        throw new Error(errorText || 'Request failed');
    }
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
