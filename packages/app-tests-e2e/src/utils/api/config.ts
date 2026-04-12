import env from "@/env";
import rootAxios from "axios";

const axios = rootAxios.create({
  baseURL: env.TEST_API_URL,
  withCredentials: true,
});

/**
 * Extract cookies from Set-Cookie response headers into a Record.
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

// CSRF token management for server-side axios calls (Node.js).
// The browser handles this via document.cookie, but in Node.js we need
// to manually fetch and attach the CSRF token.
let csrfToken = "";

async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  // Any GET request to the API will return a csrftoken cookie
  const response = await axios.get("/_allauth/browser/v1/auth/session", {
    validateStatus: () => true,
  });
  const cookies = parseCookies(response.headers["set-cookie"]);
  if (cookies.csrftoken) {
    csrfToken = cookies.csrftoken;
  }
  return csrfToken;
}

// Attach CSRF token to all unsafe requests.
// Note: requests using authHeaders() already have Cookie and X-CSRFToken set;
// the guards below (checking for existing headers) avoid duplicating them.
axios.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    const token = await ensureCsrfToken();
    if (token) {
      if (!config.headers.get("X-CSRFToken")) {
        config.headers.set("X-CSRFToken", token);
      }
      // Append csrftoken to existing Cookie header if present
      const existingCookie = config.headers.get("Cookie") as string | undefined;
      if (existingCookie && !existingCookie.includes("csrftoken=")) {
        config.headers.set("Cookie", `${existingCookie}; csrftoken=${token}`);
      } else if (!existingCookie) {
        config.headers.set("Cookie", `csrftoken=${token}`);
      }
    }
  }
  return config;
});

// Update CSRF token from response cookies
axios.interceptors.response.use((response) => {
  const cookies = parseCookies(response.headers["set-cookie"]);
  if (cookies.csrftoken) {
    csrfToken = cookies.csrftoken;
  }
  return response;
});

export { axios, parseCookies };
