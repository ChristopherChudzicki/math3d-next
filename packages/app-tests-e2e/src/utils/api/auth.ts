import { AuthApi } from "@math3d/api";
import env from "@/env";

const authApi = new AuthApi(undefined, env.TEST_API_URL);

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
    email: env.TEST_USER_1_EMAIL,
    password: env.TEST_USER_1_PASSWORD,
  },
  dynamic: {
    email: env.TEST_USER_2_EMAIL,
    password: env.TEST_USER_2_PASSWORD,
  },
};

const getAuthToken = async (user: keyof typeof users) => {
  const { email, password } = users[user];
  const response = await authApi.authTokenLoginCreate({
    TokenCreateRequest: {
      email,
      password,
    },
  });
  // @ts-expect-error drf-spectacular issue
  return response.data.auth_token;
};

export { authApi, getAuthToken, users };
