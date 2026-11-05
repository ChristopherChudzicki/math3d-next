import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";

test("a visible line label is its text", () => {
  const scene = new SceneBuilder();
  scene.folder().line({ labelVisible: "true", label: "L" }, "l");
  expect(renderGraphicSpec(scene, "l")).toMatchObject({ label: "L" });
});
