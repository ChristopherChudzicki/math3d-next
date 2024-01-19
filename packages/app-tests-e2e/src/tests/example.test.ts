import { test } from "@/fixtures/users";

test("Anonymous user", async ({ page }) => {
  await page.goto("");
  // Test stuff with an anonymous user
  // TODO: Add an assertion about user icon?
});

test.describe("Authorized user (static)", () => {
  test.use({ user: "static" });

  test("Typing arrays into an empty <math-field />", async ({ page }) => {
    await page.goto("");
    // Test stuff with a static user
    // TODO: Add an assertion about user icon?
  });
});

test.describe("Authorized user (dynamic)", () => {
  test.use({ user: "dynamic" });

  test("Typing arrays into an empty <math-field />", async ({ page }) => {
    await page.goto("");
    // Test stuff with a dynamic user
    // TODO: Add an assertion about user icon?
  });
});
