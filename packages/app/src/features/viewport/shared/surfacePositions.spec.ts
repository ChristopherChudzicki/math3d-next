import { SceneBuilder } from "@math3d/mock-api";
import { mathScopeId } from "@/store/scene/evaluation/mathScope";
import { storeWithScene } from "@/test_util/storeWithScene";
import { explicitPositions } from "./surfacePositions";

test("declines when the domain's range function throws", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface({}, "s");
  const { results } = storeWithScene(scene).mathScope.get();
  const positions = explicitPositions(
    results.get(mathScopeId("s", "expr")),
    () => {
      throw new Error("No range.");
    },
  );
  expect(positions).toBeDefined();
  expect(positions?.(Float64Array.of(0), Float64Array.of(0))).toBeUndefined();
});
