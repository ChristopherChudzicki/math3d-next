import env from "@/env";

const BASE_URL = env.TEST_API_URL.replace(/\/+$/, "");

/**
 * Extract cookies from a list of Set-Cookie header values into a Record.
 */
function parseCookies(
  setCookieHeaders: string[] | undefined,
): Record<string, string> {
  const cookies: Record<string, string> = {};
  (setCookieHeaders ?? []).forEach((header) => {
    const match = header.match(/^([^=]+)=([^;]*)/);
    if (match) {
      const [, name, value] = match;
      cookies[name] = value;
    }
  });
  return cookies;
}

// CSRF token management for server-side API calls (Node.js). The browser
// handles this via document.cookie; in Node there is no cookie jar, so we
// fetch a token once, cache it, and attach it to unsafe requests by hand.
let csrfToken = "";

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  // Any GET to the API returns a csrftoken cookie.
  const response = await fetch(`${BASE_URL}/_allauth/browser/v1/auth/session`);
  const cookies = parseCookies(response.headers.getSetCookie());
  if (cookies.csrftoken) {
    csrfToken = cookies.csrftoken;
  }
  return csrfToken;
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * `fetch` against the test API: resolves a path against the API base URL, sends
 * a JSON body, and — for unsafe methods — bootstraps and attaches the CSRF
 * token (header + cookie) unless the caller already supplied one (e.g. via
 * `authHeaders()`). Mirrors the cross-origin CSRF dance the browser does
 * automatically. Does NOT throw on non-2xx; callers branch on `response.status`.
 */
async function apiFetch(
  path: string,
  {
    body,
    headers,
    method = "GET",
  }: { body?: unknown; headers?: Record<string, string>; method?: string } = {},
): Promise<Response> {
  const finalHeaders = new Headers(headers);
  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }
  if (UNSAFE_METHODS.has(method) && !finalHeaders.has("X-CSRFToken")) {
    // Requests built with authHeaders() already carry X-CSRFToken (and the
    // csrftoken cookie), so only bootstrap a token when one is missing.
    const token = await ensureCsrfToken();
    if (token) {
      finalHeaders.set("X-CSRFToken", token);
      // Append csrftoken to an existing Cookie header if present.
      const existingCookie = finalHeaders.get("Cookie");
      if (existingCookie && !existingCookie.includes("csrftoken=")) {
        finalHeaders.set("Cookie", `${existingCookie}; csrftoken=${token}`);
      } else if (!existingCookie) {
        finalHeaders.set("Cookie", `csrftoken=${token}`);
      }
    }
  }
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // Refresh the cached token if the response rotated it.
  const cookies = parseCookies(response.headers.getSetCookie());
  if (cookies.csrftoken) {
    csrfToken = cookies.csrftoken;
  }
  return response;
}

export { apiFetch, parseCookies };
