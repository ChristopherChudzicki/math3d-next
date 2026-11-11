import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { decodePng } from "@/utils/decodePng";
import { expectThreeViewport } from "@/utils/threeViewport";

test.use({ disable3d: false });

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

test("a vector's label is drawn above its tip", async ({
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
    scene.folder().vector({
      tail: "[0, 0, -2]",
      components: "[0, 0, 2]",
      label: "v",
      labelVisible,
    });
    const key = await prepareScene(scene.json());
    await page.goto(`/${key}?renderer=threejs&controls=0`);
    await expectThreeViewport(page);
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
