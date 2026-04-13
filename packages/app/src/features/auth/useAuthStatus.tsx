import { useUserMe } from "@math3d/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Derive auth status from the useUserMe query.
 *
 * - data is a User object → "authenticated"
 * - data is null (401/403 from server) → "unauthenticated"
 * - data is undefined (query pending or errored) → "loading" or "unauthenticated"
 */
const useAuthStatus = (): AuthStatus => {
  const userMeQuery = useUserMe();
  if (userMeQuery.data) {
    return "authenticated";
  }
  if (userMeQuery.data === null) {
    return "unauthenticated";
  }
  if (userMeQuery.isError) {
    return "unauthenticated";
  }
  return "loading";
};

export { useAuthStatus };
export type { AuthStatus };
