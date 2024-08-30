import { AuthApi, deleteUser } from "@math3d/api";
import type { UserCreatePasswordRetypeRequest } from "@math3d/api";
import { faker } from "@faker-js/faker/locale/en";
import { getConfig } from "@/utils/api/config";
import env from "@/env";
import invariant from "tiny-invariant";

/**
 * Anonymouse user authentication API
 */
const authApi = new AuthApi(getConfig(null));

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

const getAuthToken = async (user: UserCredentials) => {
  const response = await authApi.authTokenLoginCreate({
    TokenCreateRequest: user,
  });
  // @ts-expect-error drf-spectacular issue
  return response.data.auth_token;
};

type UserInfo = Partial<Omit<UserCreatePasswordRetypeRequest, "re_password">>;

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
    re_password: user.password ?? defaults.password,
  };

  invariant(
    request.email.endsWith(env.TEST_EMAIL_PROVIDER),
    `Dynamically generated users in e2e tests must have emails ending with the test email provider (${env.TEST_EMAIL_PROVIDER}). Email: ${request.email}`,
  );

  const [inactive, adminToken] = await Promise.all([
    authApi.authUsersCreate({
      UserCreatePasswordRetypeRequest: request,
    }),
    getAuthToken(users.admin),
  ]);
  const adminConfig = getConfig(adminToken);
  const adminApi = new AuthApi(adminConfig);
  await adminApi.activateOther({ id: inactive.data.id });
  const cleanup = async () => {
    await deleteUser(
      { id: inactive.data.id, currentPassword: users.admin.password },
      adminConfig,
    );
  };
  const userAuth: UserCredentials = {
    email: request.email,
    password: request.password,
  };
  return { auth: userAuth, cleanup };
};

export { authApi, getAuthToken, users, createActiveUser };
export type { UserInfo, UserCredentials };
