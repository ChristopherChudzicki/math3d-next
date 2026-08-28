import { apiFetch, parseCookies } from "@/utils/api/config";
import env from "@/env";
import invariant from "tiny-invariant";
import { makeUserIdentity } from "@math3d/mock-api";
import type { UserIdentity } from "@math3d/mock-api";

type SessionCookies = { sessionid: string; csrftoken: string };

const authHeaders = (cookies: SessionCookies) => ({
  Cookie: `sessionid=${cookies.sessionid}; csrftoken=${cookies.csrftoken}`,
  "X-CSRFToken": cookies.csrftoken,
});

const users = {
  static: { email: env.TEST_USER_STATIC_EMAIL, uid: env.TEST_USER_STATIC_UID },
} satisfies Record<string, UserIdentity>;

/**
 * Sign in through the dummy provider and return session cookies.
 *
 * Signup and login are the same request: an unseen uid creates the account,
 * a known one logs into it. The provider vouches for the address, so
 * ACCOUNT_EMAIL_VERIFICATION="mandatory" never interrupts.
 *
 * Requires ENABLE_REGISTRATION=true for any first-time uid, which is every
 * ephemeral user — so the whole suite depends on it, not just signup tests.
 */
const getSessionCookies = async (
  user: UserIdentity,
): Promise<SessionCookies> => {
  const response = await apiFetch(`/_allauth/browser/v1/auth/provider/token`, {
    method: "POST",
    body: {
      provider: "dummy",
      process: "login",
      token: {
        id_token: JSON.stringify({
          id: user.uid,
          email: user.email,
          email_verified: true,
        }),
      },
    },
  });
  const cookies = parseCookies(response.headers.getSetCookie());
  invariant(
    cookies.sessionid,
    `Expected sessionid from provider/token for ${user.email} (status ${response.status}). ` +
      "A non-2xx here usually means either ENABLE_REGISTRATION is not true on the backend " +
      "(required for a first-time uid), or the dummy provider isn't installed at all, which " +
      "requires IS_DEVELOPMENT=true.",
  );
  invariant(cookies.csrftoken, "Expected csrftoken from provider/token");
  return { sessionid: cookies.sessionid, csrftoken: cookies.csrftoken };
};

/**
 * Self-delete the account owning `cookies`.
 *
 * Tolerates a 403: `delete_me` requires session auth, so an invalid or
 * already-flushed session (the account is already gone) fails auth before
 * the handler runs. This API's `AuthenticationError` handler (main/api.py)
 * reports that as 403, matching DRF convention rather than ninja's default
 * 401 — confirmed by `test_delete_requires_auth` in
 * webserver/authentication/api_test.py. Some tests delete their own user
 * mid-test, so fixture cleanup running into an already-gone account is an
 * expected case, not a dead path. Any other non-2xx is a real failure and
 * is thrown, so a leaked account is loud instead of silently swallowed.
 */
const deleteUser = async (cookies: SessionCookies): Promise<void> => {
  const response = await apiFetch(`/v1/auth/users/me/delete/`, {
    method: "POST",
    headers: authHeaders(cookies),
    body: {},
  });
  if (response.ok || response.status === 403) return;
  throw new Error(
    `Failed to delete user (status ${response.status}): ${await response.text()}`,
  );
};

/**
 * Create an account and return its identity plus a cleanup function.
 *
 * One request: the dummy token login signs up and logs in together, so the
 * old signup -> admin-activation -> login sequence is gone, and with it the
 * admin user, the /v1/auth/users/activation/ call, and the cached-admin-cookie
 * refresh.
 */
const createActiveUser = async (user: Partial<UserIdentity> = {}) => {
  const identity = makeUserIdentity(user);
  const cookies = await getSessionCookies(identity);
  const cleanup = () => deleteUser(cookies);
  return { identity, cleanup };
};

export { authHeaders, getSessionCookies, users, createActiveUser };
export type { SessionCookies, UserIdentity };
