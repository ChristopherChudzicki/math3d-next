import { test } from "@/fixtures/users";
import { SceneBuilder } from "@math3d/mock-api";

test("Anonymous user", async ({ page }) => {
  await page.goto("");
  // Test stuff with an anonymous user
  // TODO: Add an assertion about user icon?
});

test.describe("Authorized user (static)", () => {
  test.use({ user: "static" });

  test("Typing arrays into an empty <math-field />", async ({ page }) => {
    await page.goto("");
    await page.pause();
  });
});

test.describe("Authorized user (dynamic)", () => {
  test.use({ user: "dynamic" });

  test("Typing arrays into an empty <math-field />", async ({ page }) => {
    await page.goto("");
    await page.pause();
  });

  test("Building a custom scene", async ({ page, prepareScene }) => {
    const scene = new SceneBuilder();
    scene //
      .folder({ description: "Folder 1" })
      .point({ color: "orange", coords: "[1, 2, 3]" });
    const key = await prepareScene(scene);
    await page.goto(`/${key}`);
    await page.pause();
  });
});
