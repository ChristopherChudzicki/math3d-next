import { useRootSearch } from "@/services/navigation/urlState";
import { string } from "yup";

export const errorTriggerSearchFields = {
  "test-sync-error": string(),
};

/**
 * Intentional, harmless test hook. Append `?test-sync-error` to ANY page to
 * throw a synchronous render error and exercise the fallback error boundary —
 * used by the error-page e2e and for manual spot-checks. An optional value
 * customises the message (`?test-sync-error=my%20message`). Present in all
 * builds on purpose: the worst case is a curious visitor lands on the friendly
 * error page, which is exactly its job.
 */
const ErrorTrigger: React.FC = () => {
  const message = useRootSearch()["test-sync-error"];
  if (message !== undefined) {
    throw new Error(
      message || "Intentional error triggered via ?test-sync-error",
    );
  }
  return null;
};

export default ErrorTrigger;
