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
 * - data is undefined (query pending OR errored) → "loading"
 *
 * A transient backend failure (500, network, CORS) must not look like a
 * logout, so an errored query stays "loading" rather than flipping an
 * authenticated user to "unauthenticated".
 */
const useAuthStatus = (): AuthStatus => {
  const userMeQuery = useUserMe();
  if (userMeQuery.data) {
    return "authenticated";
  }
  if (userMeQuery.data === null) {
    return "unauthenticated";
  }
  return "loading";
};

export { useAuthStatus };
export type { AuthStatus };
