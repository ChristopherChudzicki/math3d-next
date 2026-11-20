import { expect } from "@playwright/test";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import {
  colorMapPlanes,
  colorMapPlanesNoMod,
  expectColorMapPlanes,
  expectColorMapPlanesNoMod,
} from "@/utils/colorMapPlanes";
import { expectThreeViewport } from "@/utils/threeViewport";

test.use({ disable3d: false });

test("three.js draws a color map with an outer mod per pixel, each surface by its own map", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(colorMapPlanes().json());
  await page.goto(`/app/frame/${key}?renderer=threejs`);

  await expectThreeViewport(page);
  await expectColorMapPlanes(page);
  await expect(page.getByTestId("scene").locator("canvas")).toHaveAttribute(
    "data-backend",
    "webgl2",
  );
  expect(errors).toEqual([]);
});

test("three.js draws a color map per pixel when it has no mod, but blends a step", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(colorMapPlanesNoMod().json());
  await page.goto(`/app/frame/${key}?renderer=threejs`);

  await expectThreeViewport(page);
  await expectColorMapPlanesNoMod(page);
  await expect(page.getByTestId("scene").locator("canvas")).toHaveAttribute(
    "data-backend",
    "webgl2",
  );
  expect(errors).toEqual([]);
});
