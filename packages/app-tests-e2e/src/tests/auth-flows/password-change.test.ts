import { test } from "@/fixtures/users";
import { expect } from "@/utils/expect";
import AppPage from "@/utils/pages/AppPage";
import env from "@/env";
import { faker } from "@faker-js/faker/locale/en";

test.describe("Password changes", () => {
  test.afterEach(() => {
    // Reset the password to original via admin user
  });

  test("Changing password settings form", async () => {});

  // validation
});
