import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT, gradients } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";
import type { SurfaceSpec } from "./types";

test("an explicit surface maps (U, V) onto its domain and colors by the raw x, y, z, as MathBox does", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface(
    {
      color: "rainbow",
      expr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y"],
        rhs: "x+y",
      },
      // y's range depends on x.
      domain: {
        type: "array",
        items: [
          {
            type: "function-assignment",
            name: "_f",
            params: ["y"],
            rhs: "[0, 2]",
          },
          {
            type: "function-assignment",
            name: "_f",
            params: ["x"],
            rhs: "[0, x]",
          },
        ],
      },
      colorExpr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "\\frac{x+y}{4}",
      },
    },
    "s",
  );
  const item = scene.items.find((x) => x.id === "s");
  invariant(item?.type === MIT.ExplicitSurface);
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;

  expect(spec.position(0.5, 0.5)).toEqual([1, 0.5, 1.5]);
  const [r, g, b] = gradients.rainbow.getRGB(1.5 / 4);
  expect(spec.colorAt(0.5, 0.5)).toEqual([
    r,
    g,
    b,
    Number(item.properties.opacity),
  ]);
  // MathBox's default line color.
  expect(spec.grid.color.slice(0, 3)).toEqual([0.5, 0.5, 0.5]);
});

test("0 gridlines along a parameter draws none along it", () => {
  const scene = new SceneBuilder();
  scene.folder().parametricSurface({ grid1: "0" }, "s");
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  expect(spec.grid.lines[0]).toBe(0);
});

test("1 gridline along a parameter draws 2, its edges", () => {
  const scene = new SceneBuilder();
  scene.folder().parametricSurface({ grid1: "1" }, "s");
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  expect(spec.grid.lines[0]).toBe(2);
});
