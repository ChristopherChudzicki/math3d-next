import { faker } from "@faker-js/faker/locale/en";
import { apiFetch, parseCookies } from "@/utils/api/config";
import env from "@/env";
import invariant from "tiny-invariant";

type UserCredentials = {
  email: string;
  password: string;
};

type SessionCookies = { sessionid: string; csrftoken: string };

const authHeaders = (cookies: SessionCookies) => ({
  Cookie: `sessionid=${cookies.sessionid}; csrftoken=${cookies.csrftoken}`,
  "X-CSRFToken": cookies.csrftoken,
});

const users = {
  /**
   * This admin user should not be necessary in actual tests, but is useful for
   * setup and teardown. E.g., this user is used to delete ephemeral test
   * accounts if they exists.
   */
  admin: {
    email: env.TEST_USER_ADMIN_EMAIL,
    password: env.TEST_USER_ADMIN_PASSWORD,
  },
  static: {
    email: env.TEST_USER_STATIC_EMAIL,
    password: env.TEST_USER_STATIC_PASSWORD,
  },
} satisfies Record<string, UserCredentials>;

/**
 * Log in via allauth and return session cookies (plus CSRF cookie).
 */
const getSessionCookies = async (
  user: UserCredentials,
): Promise<SessionCookies> => {
  const response = await apiFetch(`/_allauth/browser/v1/auth/login`, {
    method: "POST",
    body: { email: user.email, password: user.password },
  });
  const cookies = parseCookies(response.headers.getSetCookie());
  invariant(cookies.sessionid, "Expected sessionid cookie from login response");
  invariant(cookies.csrftoken, "Expected csrftoken cookie from login response");
  return { sessionid: cookies.sessionid, csrftoken: cookies.csrftoken };
};

/**
 * Log in as the given user and self-delete their account. Resolves silently if
 * login fails (e.g. the account is already gone or the password is no longer
 * valid). Leaked users are not actively reclaimed; this is harmless in CI,
 * where the database is recreated fresh each run.
 */
const deleteUser = async (user: UserCredentials): Promise<void> => {
  try {
    const cookies = await getSessionCookies(user);
    await apiFetch(`/v1/auth/users/me/delete/`, {
      method: "POST",
      headers: authHeaders(cookies),
      body: { current_password: user.password },
    });
  } catch {
    // Account already deleted or password no longer valid — ignore.
  }
};

type UserInfo = {
  email?: string;
  password?: string;
  public_nickname?: string;
};

let cachedAdminCookies: SessionCookies | null = null;

const getAdminCookies = async ({ forceRefresh = false } = {}) => {
  if (!cachedAdminCookies || forceRefresh) {
    cachedAdminCookies = await getSessionCookies(users.admin);
  }
  return cachedAdminCookies;
};

/**
 * Create a user, activate via admin, and return credentials + cleanup function.
 *
 * Flow:
 * 1. Sign up via allauth (returns 401 because email verification is mandatory)
 * 2. Admin activates the user (marks email as verified, sets is_active=True)
 * 3. User can now log in
 *
 * Cleanup deletes the user by logging in as them and calling
 * POST /v1/auth/users/me/delete/.
 */
const createActiveUser = async (user: UserInfo = {}) => {
  const defaults = {
    email: faker.internet.email({
      provider: `${faker.string.uuid()}.com`,
    }),
    public_nickname: faker.person.firstName(),
    password: faker.internet.password(),
  };

  const request = {
    ...defaults,
    ...user,
  };

  invariant(
    request.email.endsWith(env.TEST_EMAIL_PROVIDER),
    `Dynamically generated users in e2e tests must have emails ending with the test email provider (${env.TEST_EMAIL_PROVIDER}). Email: ${request.email}`,
  );

  // Sign up via allauth. Returns 401 when email verification is mandatory —
  // that's expected; any other non-2xx is a real failure.
  const signupResponse = await apiFetch(`/_allauth/browser/v1/auth/signup`, {
    method: "POST",
    body: {
      email: request.email,
      password: request.password,
      public_nickname: request.public_nickname,
    },
  });
  if (!signupResponse.ok && signupResponse.status !== 401) {
    throw new Error(`Unexpected signup status ${signupResponse.status}`);
  }

  // Admin-activate the user (marks email as verified, sets is_active=True).
  // Retry once with fresh admin cookies if the cached session has expired.
  const activate = (cookies: SessionCookies) =>
    apiFetch(`/v1/auth/users/activation/`, {
      method: "POST",
      headers: authHeaders(cookies),
      body: { email: request.email },
    });
  let activation = await activate(await getAdminCookies());
  if (activation.status === 401 || activation.status === 403) {
    activation = await activate(await getAdminCookies({ forceRefresh: true }));
  }
  if (!activation.ok) {
    throw new Error(`Activation failed with status ${activation.status}`);
  }

  const userAuth: UserCredentials = {
    email: request.email,
    password: request.password,
  };
  const cleanup = () => deleteUser(userAuth);
  const userInfo: Required<UserInfo> = {
    email: request.email,
    password: request.password,
    public_nickname: request.public_nickname,
  };
  return { auth: userAuth, info: userInfo, cleanup };
};

export { authHeaders, getSessionCookies, deleteUser, users, createActiveUser };
export type { SessionCookies, UserInfo, UserCredentials };
