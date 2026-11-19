import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { decodePng } from "@/utils/decodePng";

const BLUE = "#0000ff";

const fn = (params: string[], rhs: string) => ({
  type: "function-assignment" as const,
  name: "_f",
  params,
  rhs,
});

/** No axes or grid, and a labelled point at the origin, where the camera looks. */
const labelledPoint = (cameraPosition: string) => {
  const scene = new SceneBuilder()
    .camera({ position: cameraPosition })
    .axis("x", { visible: false })
    .axis("y", { visible: false })
    .axis("z", { visible: false })
    .grid("xy", { visible: false });
  const folder = scene.folder();
  folder.point({
    coords: "[0, 0, 0]",
    // No red in it, as in the surfaces: only the label has any.
    color: "#00ff00",
    label: "WWWW",
    labelVisible: "true",
  });
  return { scene, folder };
};

/**
 * A labelled point seen from straight above, with the flat-colored opaque
 * surface `z = rhs` in view all around it.
 */
export const labelOverSurface = (rhs: string): SceneBuilder => {
  const { scene, folder } = labelledPoint("[0, 0, 6]");
  folder.explicitSurface({
    expr: fn(["x", "y"], rhs),
    color: BLUE,
    opacity: "1",
    shaded: "false",
    gridOpacity: "0",
  });
  return scene;
};

/** A labelled point at the center of a flat-colored opaque sphere. */
export const labelInSphere = (): SceneBuilder => {
  const { scene, folder } = labelledPoint("[0, -6, 0]");
  folder.implicitSurface({
    lhs: fn(["x", "y", "z"], "x^2+y^2+z^2"),
    rhs: fn(["x", "y", "z"], "4"),
    color: BLUE,
    opacity: "1",
    shaded: "false",
  });
  return scene;
};

type Box = { left: number; right: number; top: number; bottom: number };

/**
 * The bounding box of the label's pixels (those with any red) in a window
 * around where the point's label draws, or null when there are none. The
 * window's corners must show the surface: a lost scene draw leaves them the
 * page's color.
 */
export const labelBox = async (page: Page): Promise<Box | null> => {
  const png = await page.getByTestId("scene").screenshot();
  const { data, width, height } = await decodePng(png);
  const window: Box = {
    left: Math.floor(width / 2) - 100,
    right: Math.floor(width / 2) + 100,
    top: Math.floor(height / 2) - 70,
    bottom: Math.floor(height / 2) + 20,
  };
  const red = (x: number, y: number) => data[4 * (y * width + x)];
  const blue = (x: number, y: number) => data[4 * (y * width + x) + 2];
  [
    [window.left, window.top],
    [window.right, window.top],
    [window.left, window.bottom],
    [window.right, window.bottom],
  ].forEach(([x, y]) => {
    expect(red(x, y), "the surface is drawn under the label").toBeLessThan(30);
    expect(blue(x, y), "the surface is drawn under the label").toBeGreaterThan(
      200,
    );
  });
  const box: Box = { left: Infinity, right: -1, top: Infinity, bottom: -1 };
  for (let y = window.top; y <= window.bottom; y += 1) {
    for (let x = window.left; x <= window.right; x += 1) {
      if (red(x, y) > 100) {
        box.left = Math.min(box.left, x);
        box.right = Math.max(box.right, x);
        box.top = Math.min(box.top, y);
        box.bottom = Math.max(box.bottom, y);
      }
    }
  }
  return box.right < 0 ? null : box;
};
