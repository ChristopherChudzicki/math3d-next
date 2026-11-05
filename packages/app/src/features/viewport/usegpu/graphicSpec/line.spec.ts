import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";
import type { LineSpec } from "./types";

test("a visible line label is its text", () => {
  const scene = new SceneBuilder();
  scene.folder().line({ labelVisible: "true", label: "L" }, "l");
  expect(renderGraphicSpec(scene, "l")).toMatchObject({ label: "L" });
});

test("a parametric curve samples its expression evenly across its domain", () => {
  const scene = new SceneBuilder();
  scene.folder().parametricCurve({ samples1: "3" }, "c");
  const spec = renderGraphicSpec(scene, "c") as LineSpec;
  // The default curve is [cos t, sin t, t] on [-2π, 2π].
  const expected = [-2 * Math.PI, 0, 2 * Math.PI].map((t) => [
    Math.cos(t),
    Math.sin(t),
    t,
  ]);
  expect(spec.paths).toHaveLength(1);
  expect(spec.paths[0]).toHaveLength(3);
  spec.paths[0].forEach((point, i) =>
    point.forEach((c, j) => expect(c).toBeCloseTo(expected[i][j], 6)),
  );
});
