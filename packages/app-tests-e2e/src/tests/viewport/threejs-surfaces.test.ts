import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { coloredShare, expectThreeViewport } from "@/utils/threeViewport";

test.use({ disable3d: false });

const surfaces = {
  "a surface": (scene: SceneBuilder) => scene.folder().explicitSurface(),
  "an implicit surface": (scene: SceneBuilder) =>
    scene.folder().implicitSurface(),
};

Object.entries(surfaces).forEach(([name, add]) => {
  test(`three.js draws ${name} on the WebGL2 backend`, async ({
    page,
    prepareScene,
  }) => {
    const errors = collectPageErrors(page);
    const scene = new SceneBuilder();
    add(scene);
    const key = await prepareScene(scene.json());
    await page.goto(`/${key}?renderer=threejs&controls=0`);

    await expectThreeViewport(page);
    expect(await coloredShare(page)).toBeGreaterThan(0.05);
    await expect(page.getByTestId("scene").locator("canvas")).toHaveAttribute(
      "data-backend",
      "webgl2",
    );
    expect(errors).toEqual([]);
  });
});
