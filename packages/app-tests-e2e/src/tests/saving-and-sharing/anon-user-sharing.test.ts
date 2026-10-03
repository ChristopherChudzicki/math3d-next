import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import type { Request } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";
import { faker } from "@faker-js/faker/locale/en";

test("Anon users publish once, then reuse the link until they edit", async ({
  page,
}) => {
  await page.goto("");
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({
    description: "Explicit Surface",
  });
  await item.field("description").fill(faker.lorem.words());
  const title = faker.lorem.words(3);

  await expect(app.sceneAction()).toHaveAccessibleName("Share");
  await expect(app.moreSceneActions()).not.toBeVisible();

  const url = await test.step("Publish", async () => {
    await app.sceneAction().click();
    const dialog = page.getByRole("dialog", { name: "Share scene" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog.getByRole("button", { name: "Share" }).click();
    const link = dialog.getByRole("textbox", { name: "Shareable URL" });
    await expect(link).not.toHaveValue("");
    const published = await link.inputValue();
    await expect(page).toHaveURL(published);
    await dialog.getByRole("button", { name: "Done" }).click();
    return published;
  });

  await test.step("Re-share without editing reuses the link", async () => {
    const posts: string[] = [];
    const onRequest = (r: Request) => {
      if (r.method() === "POST" && r.url().includes("/v1/scenes/")) {
        posts.push(r.url());
      }
    };
    page.on("request", onRequest);
    await app.sceneAction().click();
    const dialog = page.getByRole("dialog", { name: "Share scene" });
    await expect(
      dialog.getByRole("textbox", { name: "Shareable URL" }),
    ).toHaveValue(url);
    page.off("request", onRequest);
    expect(posts).toEqual([]);
    await dialog.getByRole("button", { name: "Done" }).click();
  });

  await test.step("The link shows what was published", async () => {
    await page.reload();
    await expect(app.sceneTitle()).toHaveText(title);
  });

  await test.step("Sharing after another edit mints a new link", async () => {
    await item.field("description").fill(faker.lorem.words());
    await app.sceneAction().click();
    const dialog = page.getByRole("dialog", { name: "Share scene" });
    const link = dialog.getByRole("textbox", { name: "Shareable URL" });
    await expect(link).not.toHaveValue("");
    expect(await link.inputValue()).not.toBe(url);
    await expect(dialog.getByText(/original link is unchanged/i)).toBeVisible();
  });
});
