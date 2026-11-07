import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";

test("A Variable shows a two-argument function name in full", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.folder().variable(
    {
      value: {
        type: "assignment",
        lhs: String.raw`f\left(x,\ y\right)`,
        rhs: "x+y",
      },
    },
    "signature",
  );
  const key = await prepareScene(scene);
  await page.goto(`/${key}`);

  const item = await new AppPage(page).getUniqueItemSettings({
    id: "signature",
  });
  // MathLive clips overflow inside its shadow root, on this element.
  const content = item.field("Value (left-hand side)").locator(".ML__content");
  // Before MathLive lays out, the content is a few pixels wide and fits trivially.
  await expect
    .poll(() => content.evaluate((el) => el.scrollWidth))
    .toBeGreaterThan(50);
  const { scrollWidth, clientWidth } = await content.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});
