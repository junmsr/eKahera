export async function api(path, options = {}, returnRawResponse = false) {
  const RENDER_URL = 'https://ekahera.onrender.com';
  const LOCAL_DEFAULT = 'http://localhost:5000';
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // During development prefer relative paths so Vite dev server proxy handles
  // routing to the backend. If `VITE_API_BASE_URL` is provided, use that.
  let API_BASE;
  if (envUrl) {
    API_BASE = envUrl;
  } else if (import.meta.env.DEV) {
    // During development prefer the local backend directly. Using an explicit
    // backend URL prevents 404s when Vite's proxy isn't active (e.g. when
    // running a preview build). If you prefer the Vite proxy, set
    // VITE_API_BASE_URL in your env.
    API_BASE = LOCAL_DEFAULT;
  } else {
    API_BASE = isLocalHost ? LOCAL_DEFAULT : RENDER_URL;
  }

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
    // Try to extract JSON error, otherwise return a concise status message.
    try {
      const errorJson = JSON.parse(errorText);
      const msg = errorJson?.error || errorJson?.message || JSON.stringify(errorJson);
      throw new Error(`${res.status} ${res.statusText}: ${msg}`);
    } catch (e) {
      // If the body looks like HTML (e.g. Vite/Express default page), hide raw HTML.
      const bodySnippet = /<[^>]+>/.test(errorText) ? 'Server returned an HTML error page' : errorText;
      throw new Error(`${res.status} ${res.statusText}: ${bodySnippet}`);
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
