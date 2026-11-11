import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { decodePng } from "@/utils/decodePng";

test.use({ disable3d: false });

/**
 * An opaque red plane seen from below, its side away from the light: only
 * ambient light reaches it, about 0.6 of the color glossy and 0.25 matte.
 */
const unlitRedPlane = () => {
  const scene = new SceneBuilder();
  scene.camera({ position: "[1, 2, -8]", target: "[0, 0, 0]" });
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

[
  { query: "", shading: "glossy", red: [130, 180] },
  { query: "&gloss=0", shading: "matte", red: [40, 100] },
].forEach(({ query, shading, red: [low, high] }) => {
  test(`three.js on the frame route lights surfaces ${shading} with "${query || "no gloss param"}"`, async ({
    page,
    prepareScene,
  }) => {
    const errors = collectPageErrors(page);
    const key = await prepareScene(unlitRedPlane().json());
    await page.goto(`/app/frame/${key}?renderer=threejs${query}`);

    const viewport = page.getByTestId("scene");
    await expect(viewport).toHaveAttribute("data-scene-ready", "true", {
      timeout: 15_000,
    });
    await expect(viewport.locator("canvas")).toHaveAttribute(
      "data-shading",
      shading,
    );
    const median = await medianRed(page);
    expect(median).toBeGreaterThan(low);
    expect(median).toBeLessThan(high);
    expect(errors).toEqual([]);
  });
});
