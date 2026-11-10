import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";
import type { LineSpec } from "@math3d/viewport-spec";

test("a vector field draws one arrow per grid point", () => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .vectorField({ samples1: "2", samples2: "1", samples3: "1" }, "f");
  const spec = renderGraphicSpec(scene, "f") as LineSpec;
  expect(spec).toMatchObject({ kind: "line", end: true });
  expect(spec.paths).toHaveLength(2);
});

test("a sample count that rounds below 1 draws nothing", () => {
  const scene = new SceneBuilder();
  scene.folder().vectorField({ samples1: "0.4" }, "f");
  expect(renderGraphicSpec(scene, "f")).toBeNull();
});

test("without an evaluated scale, arrows are scaled by 0.5 as in MathBox", () => {
  // An empty scale fails validation, which warns.
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const scene = new SceneBuilder();
  scene
    .folder()
    .vectorField(
      { samples1: "2", samples2: "1", samples3: "1", scale: "" },
      "f",
    );
  const spec = renderGraphicSpec(scene, "f") as LineSpec;
  // The default field is [y, -x, 0]/√(x² + y²); at (-5, 0, 0) that is [0, 1, 0].
  expect(spec.paths[0]).toEqual([
    [-5, 0, 0],
    [-5, 0.5, 0],
  ]);
  expect(warn).toHaveBeenCalled();
});
