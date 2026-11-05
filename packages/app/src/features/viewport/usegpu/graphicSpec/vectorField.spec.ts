import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";
import type { LineSpec } from "./types";

test("a vector field draws one arrow per grid point", () => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .vectorField({ samples1: "2", samples2: "1", samples3: "1" }, "f");
  const spec = renderGraphicSpec(scene, "f") as LineSpec;
  expect(spec).toMatchObject({ kind: "line", end: true });
  expect(spec.paths).toHaveLength(2);
});
