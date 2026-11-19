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

/** No axes or grid, and a labelled point; the camera looks at the origin. */
const labelledPoint = (cameraPosition: string, coords = "[0, 0, 0]") => {
  const scene = new SceneBuilder()
    .camera({ position: cameraPosition })
    .axis("x", { visible: false })
    .axis("y", { visible: false })
    .axis("z", { visible: false })
    .grid("xy", { visible: false });
  const folder = scene.folder();
  folder.point({
    coords,
    // No red in it, as in the other marks: only the label has any.
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

/**
 * A labelled point off the view's center, seen from straight above, with a
 * thin line crossing just over it. An opaque plane lies under the point and
 * over each place that mirrors it across the center.
 */
export const labelUnderThinLine = (): SceneBuilder => {
  const { scene, folder } = labelledPoint("[0, 0, 6]", "[0.2, 0.1, 0]");
  // 0.3 above the point, and nearer the center by that share of the
  // camera's height, so it crosses the point on screen.
  folder.line({
    coords: "[[-0.2, 0.095, 0.3], [0.6, 0.095, 0.3]]",
    color: "#000000",
    width: "2",
  });
  folder.explicitSurface({
    expr: fn(["x", "y"], "0.3-1.5x-3y"),
    color: BLUE,
    opacity: "1",
    shaded: "false",
    gridOpacity: "0",
  });
  return scene;
};

type Box = { left: number; right: number; top: number; bottom: number };

/**
 * The bounding box of the label's pixels (those with red above 100) in an
 * area around the view's center, or null when there are none. The area's
 * corners must show the surface: a lost scene draw leaves them the page's
 * color.
 */
export const labelBox = async (page: Page): Promise<Box | null> => {
  const png = await page.getByTestId("scene").screenshot();
  const { data, width, height } = await decodePng(png);
  const area: Box = {
    left: Math.floor(width / 2) - 100,
    right: Math.floor(width / 2) + 100,
    top: Math.floor(height / 2) - 70,
    bottom: Math.floor(height / 2) + 20,
  };
  const red = (x: number, y: number) => data[4 * (y * width + x)];
  const blue = (x: number, y: number) => data[4 * (y * width + x) + 2];
  [
    [area.left, area.top],
    [area.right, area.top],
    [area.left, area.bottom],
    [area.right, area.bottom],
  ].forEach(([x, y]) => {
    expect(red(x, y), "the surface is drawn under the label").toBeLessThan(30);
    expect(blue(x, y), "the surface is drawn under the label").toBeGreaterThan(
      200,
    );
  });
  const box: Box = { left: Infinity, right: -1, top: Infinity, bottom: -1 };
  for (let y = area.top; y <= area.bottom; y += 1) {
    for (let x = area.left; x <= area.right; x += 1) {
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
