import { test, expect } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { getItemForm, makeItem, pwHelpersExist, getLatex } from "./util";

test("Typing arrays into an empty <math-field />", async ({ page }) => {
  const point = makeItem(MIT.Point, { description: "SomePoint", coords: "" });
  const sceneId = faker.datatype.uuid();
  await page.addInitScript(() => {
    window.$pwCustomSeed = true;
  });

  await page.goto(`/${sceneId}`);
  await expect.poll(pwHelpersExist(page)).toBeTruthy();
  await page.evaluate(
    ({ items, id }) => {
      window.$pw.seedDb.withSceneFromItems(items, { id });
      window.$pw.doneSeeding();
    },
    { items: [point], id: sceneId }
  );

  const form = getItemForm(page, point);
  const mf = await form.locator('css=[aria-label="Coordinates"]');
  await mf.type("[1,2,3,]");
  expect(await mf.evaluate(getLatex)).toBe(
    String.raw`\left\lbrack1,2,3,\right\rbrack`
  );
});
