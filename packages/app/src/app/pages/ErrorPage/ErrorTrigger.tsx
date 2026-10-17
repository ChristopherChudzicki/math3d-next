import { useSearchParams } from "react-router";

/** Query param that, when present on any route, throws a synchronous render error. */
export const TEST_SYNC_ERROR_PARAM = "test-sync-error";

/**
 * Intentional, harmless test hook. Append `?test-sync-error` to ANY page to
 * throw a synchronous render error and exercise the fallback error boundary —
 * used by the error-page e2e and for manual spot-checks. An optional value
 * customises the message (`?test-sync-error=my%20message`). Present in all
 * builds on purpose: the worst case is a curious visitor lands on the friendly
 * error page, which is exactly its job.
 */
const ErrorTrigger: React.FC = () => {
  const [params] = useSearchParams();
  if (params.has(TEST_SYNC_ERROR_PARAM)) {
    throw new Error(
      params.get(TEST_SYNC_ERROR_PARAM) ||
        "Intentional error triggered via ?test-sync-error",
    );
  }
  return null;
};

export default ErrorTrigger;
