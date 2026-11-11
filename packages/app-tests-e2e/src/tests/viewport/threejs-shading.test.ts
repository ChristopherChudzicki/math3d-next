import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { decodePng } from "@/utils/decodePng";
import { expectThreeViewport } from "@/utils/threeViewport";

test.use({ disable3d: false });

/**
 * An opaque red plane z = 0, seen from `camera`. From below, only ambient
 * light reaches its visible side; from above, the key light does too.
 */
const redPlane = (camera: string) => {
  const scene = new SceneBuilder();
  scene.camera({ position: camera, target: "[0, 0, 0]" });
  scene.folder().explicitSurface({
    expr: {
      type: "function-assignment",
      name: "_f",
      params: ["x", "y"],
      rhs: "0",
    },
    color: "#ff0000",
    opacity: "1",
    gridOpacity: "0",
  });
  return scene;
};

/** The median red channel of the frame's red pixels. */
const medianRed = async (page: Page) => {
  const { data } = await decodePng(
    await page.getByTestId("scene").screenshot(),
  );
  const reds: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r > 30 && g < 30 && b < 30) reds.push(r);
  }
  expect(reds.length).toBeGreaterThan(data.length / 4 / 20);
  reds.sort((a, b) => a - b);
  return reds[Math.floor(reds.length / 2)];
};

const BELOW = "[1, 2, -8]";
const ABOVE = "[1, 2, 8]";

[
  // Ambient only: 0.6 of the color glossy, about 0.25 matte.
  {
    side: "unlit",
    camera: BELOW,
    query: "",
    shading: "glossy",
    red: [130, 180],
  },
  {
    side: "unlit",
    camera: BELOW,
    query: "&gloss=0",
    shading: "matte",
    red: [40, 100],
  },
  // Ambient plus the key light's diffuse term.
  { side: "lit", camera: ABOVE, query: "", shading: "glossy", red: [200, 240] },
].forEach(({ side, camera, query, shading, red: [low, high] }) => {
  test(`three.js on the frame route lights a surface's ${side} side ${shading} with "${query || "no gloss param"}"`, async ({
    page,
    prepareScene,
  }) => {
    const errors = collectPageErrors(page);
    const key = await prepareScene(redPlane(camera).json());
    await page.goto(`/app/frame/${key}?renderer=threejs${query}`);

    await expectThreeViewport(page);
    await expect(page.getByTestId("scene").locator("canvas")).toHaveAttribute(
      "data-shading",
      shading,
    );
    const median = await medianRed(page);
    expect(median).toBeGreaterThan(low);
    expect(median).toBeLessThan(high);
    expect(errors).toEqual([]);
  });
});
