import { useUserMe } from "@math3d/api";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Derive auth status from the useUserMe query.
 *
 * The user-me check runs regardless of DISPLAY_AUTH_FLOWS. That flag is
 * presentation-only — it hides the sign-in affordances — so a session that
 * already exists while it is off must still yield the authenticated view. UI
 * visibility is gated by the flag at the component level (Header, UserMenu,
 * ScenesListPage), not here.
 *
 * - data is a User object → "authenticated"
 * - data is null (401/403 from server) → "unauthenticated"
 * - the query failed and never had data → "unauthenticated"
 * - otherwise (still in flight) → "loading"
 *
 * "loading" has to be a state the app leaves: consumers hide the sign-in
 * affordances during it, and `createQueryClient` does not retry a 500. Check
 * `data` before `isError` — a refetch failure reports `isError` while keeping
 * the last success — so only a query that never answered reads as signed out.
 */
const useAuthStatus = (): AuthStatus => {
  const userMeQuery = useUserMe();
  if (userMeQuery.data) {
    return "authenticated";
  }
  if (userMeQuery.data === null || userMeQuery.isError) {
    return "unauthenticated";
  }
  return "loading";
};

export { useAuthStatus };
export type { AuthStatus };
