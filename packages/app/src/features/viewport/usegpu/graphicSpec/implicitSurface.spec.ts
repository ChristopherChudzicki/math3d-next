import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";
import type { ImplicitSurfaceSpec } from "./types";

test("an implicit surface is the zero level set of lhs − rhs", () => {
  const scene = new SceneBuilder();
  scene.folder().implicitSurface({}, "s");
  const spec = renderGraphicSpec(scene, "s") as ImplicitSurfaceSpec;
  // The defaults: x² + y² = z² + 1.
  expect(spec.value(1, 2, 3)).toBe(5 - 10);
});
