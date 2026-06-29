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
  constructor(
    public readonly status: number,
    public readonly data: unknown,
    public readonly response: Response,
  ) {
    super(`API request failed with status ${status}`);
    this.name = "ApiError";
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
