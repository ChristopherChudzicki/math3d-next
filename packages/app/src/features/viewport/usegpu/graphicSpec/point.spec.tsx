import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";

test("a point reports its evaluated coordinates, color and zIndex", () => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .point(
      { coords: "[1, 2, 3]", color: "red", opacity: "0.5", zIndex: "3" },
      "p",
    );
  expect(renderGraphicSpec(scene, "p")).toMatchObject({
    kind: "point",
    positions: [[1, 2, 3]],
    color: [1, 0, 0, 0.5],
    zIndex: 3,
  });
});
