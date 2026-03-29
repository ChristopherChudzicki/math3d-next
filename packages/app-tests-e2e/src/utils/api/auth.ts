import { faker } from "@faker-js/faker/locale/en";
import { axios } from "@/utils/api/config";
import { getInbox } from "@/utils/inbox/emails";
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
  // Extract cookies from the Set-Cookie response headers
  const setCookieHeaders: string[] = response.headers["set-cookie"] ?? [];
  const cookies: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const match = header.match(/^([^=]+)=([^;]*)/);
    if (match) {
      cookies[match[1]] = match[2];
    }
  }
  invariant(cookies.sessionid, "Expected sessionid cookie from login response");
  invariant(cookies.csrftoken, "Expected csrftoken cookie from login response");
  return { sessionid: cookies.sessionid, csrftoken: cookies.csrftoken };
};

/**
 * Extract the verification key from an activation email's HTML content.
 * The activation link has `data-testid="activation-link"` and the URL
 * contains `?key=...`.
 */
const extractVerificationKey = (html: string): string => {
  // Match the href of an element with data-testid="activation-link"
  const linkMatch = html.match(
    /data-testid=["']activation-link["'][^>]*href=["']([^"']+)["']/,
  );
  // Also try href before data-testid
  const linkMatch2 = html.match(
    /href=["']([^"']+)["'][^>]*data-testid=["']activation-link["']/,
  );
  const href = linkMatch?.[1] ?? linkMatch2?.[1];
  invariant(href, "Expected activation-link with href in email HTML");
  const url = new URL(href);
  const key = url.searchParams.get("key");
  invariant(key, "Expected activation link to have ?key= parameter");
  return key;
};

type UserInfo = {
  email?: string;
  password?: string;
  public_nickname?: string;
};

/**
 * Create a user, verify their email, and return credentials + cleanup function.
 *
 * Flow:
 * 1. Sign up via allauth (returns 401 because email verification is mandatory)
 * 2. Retrieve the verification email from the file inbox
 * 3. Extract the verification key and verify the email via allauth
 * 4. User can now log in
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

  // Retrieve the verification email and extract the key
  const inbox = getInbox();
  const message = await inbox.waitForEmail({
    subject: "Activate your account",
    to: request.email,
  });
  invariant(message.html, "Expected activation email to have HTML content");
  const key = extractVerificationKey(message.html);

  // Verify the email via allauth
  try {
    await axios.post(`/_allauth/browser/v1/auth/email/verify`, { key });
  } catch (err: unknown) {
    // allauth returns 401 after verification (user not logged in) — that's OK.
    const isExpected401 =
      err &&
      typeof err === "object" &&
      "response" in err &&
      (err as { response?: { status?: number } }).response?.status === 401;
    if (!isExpected401) {
      throw err;
    }
  }

  const cleanup = async () => {
    // Log in as the user and self-delete
    const userCookies = await getSessionCookies({
      email: request.email,
      password: request.password,
    });
    const cookieHeader = `sessionid=${userCookies.sessionid}; csrftoken=${userCookies.csrftoken}`;
    await axios.delete(`/v0/auth/users/me/`, {
      data: { current_password: request.password },
      headers: {
        Cookie: cookieHeader,
        "X-CSRFToken": userCookies.csrftoken,
      },
    });
  };

  const userAuth: UserCredentials = {
    email: request.email,
    password: request.password,
  };
  return { auth: userAuth, cleanup };
};

export { getSessionCookies, users, createActiveUser };
export type { UserInfo, UserCredentials };
