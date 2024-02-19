import { test as setup } from "@/fixtures/users";
import { deleteUser, AuthApi } from "@math3d/api";
import invariant from "tiny-invariant";
import env from "@/env";
import { getConfig, axios } from "@/utils/api";
import { getInbox } from "./utils/inbox/emails";

const inbox = getInbox();

setup("Clear emails", async () => {
  await inbox.deleteAll();
});

setup.describe("Wipe ephemeral accounts", async () => {
  setup.use({ user: "admin" });

  setup("Delete all ephemeral accounts", async ({ authToken }) => {
    invariant(authToken, "Expected an auth token");
    const config = getConfig(authToken);
    const api = new AuthApi(config);
    const { data: response } = await api.authUsersList({
      email: env.TEST_USER_3_EMAIL,
    });
    const { results: users } = response;
    invariant(users, "Expected users to be defined");
    invariant(users.length <= 1, "Expected at most one user with this email");
    if (users.length === 1) {
      await deleteUser(
        { id: users[0].id, currentPassword: env.TEST_USER_ADMIN_PASSWORD },
        config,
        axios,
      );
    }
  });
});
