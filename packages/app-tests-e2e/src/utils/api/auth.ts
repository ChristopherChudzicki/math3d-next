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
 * A flushed session (the account is already gone, deleted by the test itself)
 * fails auth before `delete_me` runs, which this API reports as 403 with
 * `{"detail": "Forbidden."}` rather than ninja's default 401 — so cleanup
 * tolerates exactly that body. Any other 403, such as Django's CSRF
 * rejection, throws, keeping a leaked account loud.
 */
const deleteUser = async (cookies: SessionCookies): Promise<void> => {
  const response = await apiFetch(`/v1/auth/users/me/delete/`, {
    method: "POST",
    headers: authHeaders(cookies),
    body: {},
  });
  if (response.ok) return;
  const text = await response.text();
  if (response.status === 403) {
    let isAuthRejection = false;
    try {
      isAuthRejection = JSON.parse(text)?.detail === "Forbidden.";
    } catch {
      // Not JSON: not this API's auth rejection shape.
    }
    if (isAuthRejection) return;
  }
  throw new Error(`Failed to delete user (status ${response.status}): ${text}`);
};

/**
 * Create an account, returning its identity, session cookies, and a cleanup
 * function. The dummy token login signs up and logs in with one request.
 */
const createActiveUser = async (user: Partial<UserIdentity> = {}) => {
  const identity = makeUserIdentity(user);
  const cookies = await getSessionCookies(identity);
  const cleanup = () => deleteUser(cookies);
  return { identity, cookies, cleanup };
};

export { authHeaders, getSessionCookies, users, createActiveUser };
export type { SessionCookies, UserIdentity };
