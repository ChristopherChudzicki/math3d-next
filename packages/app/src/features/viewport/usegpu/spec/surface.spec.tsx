import { SceneBuilder } from "@math3d/mock-api";
import { gradients } from "@math3d/mathitem-configs";
import type { SurfaceSpec } from "./types";
import { renderSpec } from "./testUtils";

test("an explicit surface's gradient takes the raw x, y, z, as MathBox's does", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface(
    {
      color: "rainbow",
      expr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y"],
        rhs: "0.25",
      },
      colorExpr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "z",
      },
    },
    "s",
  );
  const spec = renderSpec(scene, "s") as SurfaceSpec;
  const [r, g, b] = gradients.rainbow.getRGB(0.25);
  expect(spec.colorAt(0.5, 0.5)).toEqual([r, g, b, 0.75]);
});
