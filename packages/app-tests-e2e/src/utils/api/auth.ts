import { faker } from "@faker-js/faker/locale/en";
import { axios, parseCookies } from "@/utils/api/config";
import env from "@/env";
import invariant from "tiny-invariant";

type UserCredentials = {
  email: string;
  password: string;
};

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
): Promise<{ sessionid: string; csrftoken: string }> => {
  const response = await axios.post(`/_allauth/browser/v1/auth/login`, {
    email: user.email,
    password: user.password,
  });
  const cookies = parseCookies(response.headers["set-cookie"]);
  invariant(cookies.sessionid, "Expected sessionid cookie from login response");
  invariant(cookies.csrftoken, "Expected csrftoken cookie from login response");
  return { sessionid: cookies.sessionid, csrftoken: cookies.csrftoken };
};

type UserInfo = {
  email?: string;
  password?: string;
  public_nickname?: string;
};

/**
 * Create a user, activate via admin, and return credentials + cleanup function.
 *
 * Flow:
 * 1. Sign up via allauth (returns 401 because email verification is mandatory)
 * 2. Admin activates the user (marks email as verified, sets is_active=True)
 * 3. User can now log in
 *
 * Cleanup deletes the user by logging in as them and calling DELETE /v0/auth/users/me/.
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

  // Sign up via allauth. Returns 401 when email verification is mandatory.
  try {
    await axios.post(`/_allauth/browser/v1/auth/signup`, {
      email: request.email,
      password: request.password,
      public_nickname: request.public_nickname,
    });
  } catch (err: unknown) {
    // allauth returns 401 when email verification is mandatory — that's expected.
    const isExpected401 =
      err &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 401;
    if (!isExpected401) {
      throw err;
    }
  }

  // Admin-activate the user (marks email as verified, sets is_active=True)
  const adminCookies = await getSessionCookies(users.admin);
  await axios.post(
    `/v0/auth/users/activation/`,
    { email: request.email },
    {
      headers: {
        Cookie: `sessionid=${adminCookies.sessionid}; csrftoken=${adminCookies.csrftoken}`,
        "X-CSRFToken": adminCookies.csrftoken,
      },
    },
  );

  const cleanup = async () => {
    // Log in as the user and self-delete.
    // If login fails (e.g., the test changed the password), ignore the error.
    // The user has a test email provider domain and will be cleaned up by
    // seed_test_data on the next test run.
    try {
      const userCookies = await getSessionCookies({
        email: request.email,
        password: request.password,
      });
      await axios.delete(`/v0/auth/users/me/`, {
        data: { current_password: request.password },
        headers: {
          Cookie: `sessionid=${userCookies.sessionid}; csrftoken=${userCookies.csrftoken}`,
          "X-CSRFToken": userCookies.csrftoken,
        },
      });
    } catch {
      // User may already be deleted or password was changed — ignore
    }
  };

  const userAuth: UserCredentials = {
    email: request.email,
    password: request.password,
  };
  return { auth: userAuth, cleanup };
};

export { getSessionCookies, users, createActiveUser };
export type { UserInfo, UserCredentials };
