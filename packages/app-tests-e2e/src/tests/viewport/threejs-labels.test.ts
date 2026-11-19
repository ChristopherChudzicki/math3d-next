import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { decodePng } from "@/utils/decodePng";
import {
  labelBox,
  labelInSphere,
  labelOverSurface,
  labelUnderThinLine,
} from "@/utils/threeLabels";
import { expectThreeViewport } from "@/utils/threeViewport";

test.use({ disable3d: false });

/** Loads a scene and waits for it to draw on WebGL2, order-independently. */
const show = async (page: Page, key: string) => {
  await page.goto(`/${key}?renderer=threejs&controls=0`);
  await expectThreeViewport(page);
  const canvas = page.getByTestId("scene").locator("canvas");
  await expect(canvas).toHaveAttribute("data-backend", "webgl2");
  await expect(canvas).toHaveAttribute("data-transparency", "oit");
};

/** The bounding box of the pixels that differ between two PNG screenshots. */
const differingBox = async (a: Buffer, b: Buffer) => {
  const [x, y] = await Promise.all([decodePng(a), decodePng(b)]);
  const box = { left: Infinity, right: -1, top: Infinity, bottom: -1 };
  for (let i = 0; i < x.data.length; i += 4) {
    const diff = Math.max(
      ...[0, 1, 2].map((c) => Math.abs(x.data[i + c] - y.data[i + c])),
    );
    if (diff > 60) {
      const column = (i / 4) % x.width;
      const row = Math.floor(i / 4 / x.width);
      box.left = Math.min(box.left, column);
      box.right = Math.max(box.right, column);
      box.top = Math.min(box.top, row);
      box.bottom = Math.max(box.bottom, row);
    }
  }
  return { ...box, width: x.width, height: x.height };
};

test("a vector's label is drawn above its tip, which its arrowhead covers from behind", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  // The camera looks at the vector's tip, so the tip is at the center.
  const screenshot = async (labelVisible: string) => {
    // No axes: the y axis points at the camera, so its labels pile up at the
    // tip, where the vector's label overlaps them.
    const scene = new SceneBuilder()
      .camera({ position: "[0, -6, 0]" })
      .axis("x", { visible: false })
      .axis("y", { visible: false })
      .axis("z", { visible: false });
    // Pointing away from the camera, a little upward.
    scene.folder().vector({
      tail: "[0, -2, -0.3]",
      components: "[0, 2, 0.3]",
      label: "v",
      labelVisible,
    });
    await show(page, await prepareScene(scene.json()));
    return page.getByTestId("scene").screenshot();
  };

  const box = await differingBox(
    await screenshot("true"),
    await screenshot("false"),
  );

  expect(box.right, "the label drew").toBeGreaterThanOrEqual(0);
  // A "v", with neither ascender nor descender, centers on its em box.
  const center = {
    x: (box.left + box.right) / 2,
    y: (box.top + box.bottom) / 2,
  };
  expect(Math.abs(center.x - box.width / 2)).toBeLessThan(4);
  // `line.ts` puts the label 24 px above the tip.
  expect(Math.abs(center.y - (box.height / 2 - 24))).toBeLessThan(5);
  expect(errors).toEqual([]);
});

test("a label over an opaque surface that tilts across it draws whole", async ({
  page,
  prepareScene,
}) => {
  // It loads two scenes.
  test.slow();
  const errors = collectPageErrors(page);
  const boxOver = async (surface: string) => {
    await show(page, await prepareScene(labelOverSurface(surface).json()));
    return labelBox(page);
  };

  // Through the label's anchor, rising across the label's width.
  const tilted = await boxOver("x+y");
  const flatBelow = await boxOver("-1");

  expect(flatBelow, "the label drew").not.toBeNull();
  expect(tilted).toEqual(flatBelow);
  expect(errors).toEqual([]);
});

test("a label inside an opaque solid is hidden", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  await show(page, await prepareScene(labelInSphere().json()));

  expect(await labelBox(page)).toBeNull();
  expect(errors).toEqual([]);
});

test("a label off the view's center shows where a thin line crosses its anchor", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  await show(page, await prepareScene(labelUnderThinLine().json()));

  expect(await labelBox(page)).not.toBeNull();
  expect(errors).toEqual([]);
});
