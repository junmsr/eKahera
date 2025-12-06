export async function api(path, options = {}, returnRawResponse = false) {
  // Prefer the explicitly provided env var. If absent:
  // - in dev use the local backend so `npm run dev` + Vite proxy still works
  // - in production use a relative path (empty string) so callers can set the
  //   correct API host during the build/deploy (recommended)
  const LOCAL_DEFAULT = "http://localhost:5000";
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  let API_BASE = "";
  if (envUrl) {
    API_BASE = envUrl;
  } else if (import.meta.env.DEV) {
    API_BASE = LOCAL_DEFAULT;
  } else {
    // production: default to relative paths. Deployment should set
    // VITE_API_BASE_URL to the deployed backend (e.g. https://api.example.com)
    API_BASE = "";
  }

  // Normalize: remove trailing slash if present so concatenation is consistent
  if (API_BASE && API_BASE.endsWith("/")) API_BASE = API_BASE.slice(0, -1);

  const headers = { ...(options.headers || {}) };
  // Let the browser set the Content-Type for FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Get token from sessionStorage first, then localStorage
  const token =
    sessionStorage.getItem("auth_token") || localStorage.getItem("token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const finalUrl =
    (API_BASE || "") + (path.startsWith("/api") ? path : `/api${path}`);
  const res = await fetch(finalUrl, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();

    // Provide user-friendly error messages for common status codes
    if (res.status === 400) {
      // Handle specific 400 errors like OTP validation
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error && errorJson.error.includes("Invalid OTP")) {
          const attemptsLeft = errorJson.attemptsLeft || 0;
          throw new Error(
            `Invalid verification code. ${attemptsLeft} attempts remaining.`
          );
        }
      } catch (e) {
        // If parsing fails or it's not an OTP error, continue to general 400 handling
      }
      throw new Error(
        "Invalid request. Please check your input and try again."
      );
    } else if (res.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    } else if (res.status === 403) {
      throw new Error("You do not have permission to perform this action.");
    } else if (res.status === 404) {
      throw new Error("The requested resource was not found.");
    } else if (res.status === 500) {
      throw new Error("Server error occurred. Please try again later.");
    }

    // Try to extract JSON error, otherwise return a concise status message.
    try {
      const errorJson = JSON.parse(errorText);
      const msg =
        errorJson?.error || errorJson?.message || JSON.stringify(errorJson);
      throw new Error(`${res.status} ${res.statusText}: ${msg}`);
    } catch (e) {
      // If the body looks like HTML (e.g. Vite/Express default page), hide raw HTML.
      const bodySnippet = /<[^>]+>/.test(errorText)
        ? "Server returned an HTML error page"
        : errorText;
      throw new Error(`${res.status} ${res.statusText}: ${bodySnippet}`);
    }
  }

  if (returnRawResponse) {
    return res;
  }

  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createGcashCheckout({
  amount,
  description,
  referenceNumber,
  cancelUrl,
  successUrl,
}) {
  return await api("/payments/gcash/checkout", {
    method: "POST",
    body: JSON.stringify({
      amount,
      description,
      referenceNumber,
      cancelUrl,
      successUrl,
    }),
  });
}

export async function createMayaCheckout({ amount, description, referenceNumber, cancelUrl, successUrl }) {
  return await api('/payments/maya/checkout', {
    method: 'POST',
    body: JSON.stringify({ amount, description, referenceNumber, cancelUrl, successUrl })
  });
}
