import { AxiosError } from "axios";

/**
 * Returns `true` if error is an AxiosError with a response status in `statuses`.
 */
export const isAxiosError = (
  error: unknown,
  statuses: number[],
): error is AxiosError => {
  if (!(error instanceof AxiosError)) return false;
  return (statuses as (number | undefined)[]).includes(error.response?.status);
};
