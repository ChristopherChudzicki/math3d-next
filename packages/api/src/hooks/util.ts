import createClient, { type Middleware } from "openapi-fetch";
import type { paths as V1Paths } from "../generated-v1";
import type { paths as AllauthPaths } from "../generated-allauth";
import { ApiError } from "../util";

// Read CSRF token from cookie before each request.
// The cookie is set with CSRF_COOKIE_DOMAIN so it's readable across subdomains
// (e.g., math3d.localdev:3000 can read cookies set by api.math3d.localdev:8000).
function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? match[1] : "";
}

// openapi-fetch has no global singleton (unlike axios), so the cross-origin
// session concerns — sending the CSRF header read from the cookie — are handled
// by a per-client middleware. Cookies themselves ride along via
// `credentials: "include"` set on each client below.
const CSRF_SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS", "TRACE"]);
const csrfMiddleware: Middleware = {
  onRequest({ request }) {
    // Django only enforces CSRF on unsafe methods; skip the X-CSRFToken header
    // on safe ones so GETs don't needlessly send it (matches the e2e harness).
    if (CSRF_SAFE_METHODS.has(request.method)) return request;
    const token = getCsrfToken();
    if (token) {
      request.headers.set("X-CSRFToken", token);
    }
    return request;
  },
};

const getBasePath = () => import.meta.env?.VITE_API_BASE_URL as string;

// Late-bind fetch. openapi-fetch captures `globalThis.fetch` when the client is
// constructed (here, at module load); resolving it per-call instead lets
// test-time interceptors that replace `globalThis.fetch` (MSW) take effect.
const lateBoundFetch = (...args: Parameters<typeof fetch>) =>
  globalThis.fetch(...args);

// Build an openapi-fetch client with our shared cross-origin wiring: the API
// base URL, cookie credentials, a late-bound fetch (so MSW intercepts in
// tests), and the CSRF middleware. Both clients go through here so the wiring
// can't drift between them.
const createApiClient = <Paths extends object>(
  opts: { baseUrl?: string; headers?: Record<string, string> } = {},
) => {
  const client = createClient<Paths>({
    baseUrl: opts.baseUrl ?? getBasePath(),
    credentials: "include",
    headers: opts.headers,
    fetch: lateBoundFetch,
  });
  client.use(csrfMiddleware);
  return client;
};

/**
 * Create an openapi-fetch client for the v1 (Ninja) API. The app uses the
 * default `v1Client`; callers that need a different origin or explicit auth
 * headers (e.g. the e2e suite running in Node) can pass `baseUrl`/`headers`.
 */
const createV1Client = (
  opts: { baseUrl?: string; headers?: Record<string, string> } = {},
): ReturnType<typeof createClient<V1Paths>> => createApiClient<V1Paths>(opts);

const v1Client = createV1Client();

const allauthClient = createApiClient<AllauthPaths>();

/** Build an ApiError from an openapi-fetch result's `response` + `error` body. */
const toApiError = (response: Response, error: unknown) =>
  new ApiError(response.status, error, response);

/**
 * Resolve an openapi-fetch result, throwing ApiError on any non-2xx so
 * react-query marks the query/mutation as failed and consumers can read the
 * typed error body. Use this for requests where every non-2xx is a genuine
 * error; requests that treat a specific status as success (e.g. allauth's
 * 401-as-flow) handle the result inline instead.
 */
async function unwrap<T>(
  result: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  const { data, error, response } = await result;
  if (!response.ok) {
    throw toApiError(response, error);
  }
  return data as T;
}

export {
  csrfMiddleware,
  createV1Client,
  v1Client,
  allauthClient,
  unwrap,
  toApiError,
};
