type Endpoint = { method: string; schemaPath: string };

const endpoints = new WeakMap<Response, Endpoint>();

/**
 * Record which endpoint produced `response`, so an `ApiError` built from it
 * can name the endpoint. The client middleware calls this for every response;
 * it's exported for tests that build an `ApiError` by hand.
 */
export const recordEndpoint = (response: Response, endpoint: Endpoint) => {
  endpoints.set(response, endpoint);
};

/**
 * Error thrown by the API hooks on a non-2xx response.
 *
 * openapi-fetch returns `{ data, error }` rather than throwing, so the hooks
 * convert a non-success response into this error — carrying the typed error
 * body — so that react-query marks the query/mutation as failed and consumers
 * (e.g. `setFieldErrors`) can read the field-level errors. The hooks throw this
 * for non-2xx responses from both the v1 and allauth clients.
 */
export class ApiError extends Error {
  readonly method?: string;

  /** The OpenAPI path, e.g. `/v1/scenes/{key}/`; never the requested URL. */
  readonly schemaPath?: string;

  constructor(
    public readonly status: number,
    public readonly data: unknown,
    public readonly response: Response,
  ) {
    const endpoint = endpoints.get(response);
    super(
      endpoint
        ? `${endpoint.method} ${endpoint.schemaPath} → ${status}`
        : `API request failed with status ${status}`,
    );
    this.name = "ApiError";
    this.method = endpoint?.method;
    this.schemaPath = endpoint?.schemaPath;
  }
}

/** Error thrown by the API clients when a request gets no response at all. */
export class NetworkError extends Error {
  constructor(
    public readonly method: string,
    public readonly schemaPath: string,
    cause: unknown,
  ) {
    super(`${method} ${schemaPath} → network error`, { cause });
    this.name = "NetworkError";
  }
}

/**
 * Returns `true` if error is an ApiError whose status is in `statuses`
 * (or any status when `statuses` is omitted).
 */
export const isApiError = (
  error: unknown,
  statuses?: number[],
): error is ApiError =>
  error instanceof ApiError &&
  (statuses === undefined || statuses.includes(error.status));

/** Returns `true` for the errors the API clients throw for a failed request. */
export const isApiFailure = (
  error: unknown,
): error is ApiError | NetworkError =>
  error instanceof ApiError || error instanceof NetworkError;

/**
 * - `"expected"`: an `ApiError` whose status the caller declared expected.
 * - `"unreachable"`: the request got no response.
 * - `"bug"`: anything else, plausibly a bug on our side.
 */
export type FailureClass = "expected" | "unreachable" | "bug";

export const classifyFailure = (
  error: unknown,
  expectedErrors: number[] = [],
): FailureClass => {
  if (isApiError(error, expectedErrors)) return "expected";
  if (error instanceof NetworkError) return "unreachable";
  return "bug";
};
