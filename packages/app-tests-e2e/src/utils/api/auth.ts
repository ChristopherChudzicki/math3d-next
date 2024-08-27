import { AuthApi, TokenCreateRequest, deleteUser } from "@math3d/api";
import type { UserCreatePasswordRetypeRequest } from "@math3d/api";
import { faker } from "@faker-js/faker/locale/en";
import { getConfig } from "@/utils/api/config";
import env from "@/env";

/**
 * Anonymouse user authentication API
 */
const authApi = new AuthApi(getConfig(null));

type UserAuth = {
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
} satisfies Record<string, UserAuth>;

const getAuthToken = async (user: keyof typeof users | TokenCreateRequest) => {
  const userObj = typeof user === "string" ? users[user] : user;
  const { email, password } = userObj;
  const response = await authApi.authTokenLoginCreate({
    TokenCreateRequest: {
      email,
      password,
    },
  });
  // @ts-expect-error drf-spectacular issue
  return response.data.auth_token;
};

type UserFixture = Partial<
  Omit<UserCreatePasswordRetypeRequest, "re_password">
>;

const createActiveUser = async (user: UserFixture = {}) => {
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
  const userAuth: UserAuth = {
    email: request.email,
    password: request.password,
  };
  return { auth: userAuth, cleanup };
};

export { authApi, getAuthToken, users, createActiveUser };
export type { UserFixture };
