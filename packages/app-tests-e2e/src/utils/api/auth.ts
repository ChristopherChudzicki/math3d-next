import { apiFetch, parseCookies } from "@/utils/api/config";
import env from "@/env";
import invariant from "tiny-invariant";
import { makeUserInfo } from "@math3d/mock-api";
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
    `Expected sessionid from provider/token for ${user.email} (status ${response.status}). A 403 means ENABLE_REGISTRATION is not true.`,
  );
  invariant(cookies.csrftoken, "Expected csrftoken from provider/token");
  return { sessionid: cookies.sessionid, csrftoken: cookies.csrftoken };
};

/**
 * Self-delete the account owning `cookies`. Resolves silently if the account
 * is already gone — tests that delete their own user still run fixture
 * cleanup afterwards.
 */
const deleteUser = async (cookies: SessionCookies): Promise<void> => {
  try {
    await apiFetch(`/v1/auth/users/me/delete/`, {
      method: "POST",
      headers: authHeaders(cookies),
      body: {},
    });
  } catch {
    // Already deleted, or the session no longer resolves — nothing to do.
  }
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
  const identity = makeUserInfo(user);
  const cookies = await getSessionCookies(identity);
  const cleanup = () => deleteUser(cookies);
  return { identity, cleanup };
};

export { authHeaders, getSessionCookies, deleteUser, users, createActiveUser };
export type { SessionCookies, UserIdentity };
