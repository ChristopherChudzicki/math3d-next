import { SceneBuilder } from "@math3d/mock-api";
import { renderSpec } from "./testUtils";

test("a point reports its evaluated coordinates, color and zIndex", () => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .point(
      { coords: "[1, 2, 3]", color: "#ff0000", opacity: "0.5", zIndex: "3" },
      "p",
    );
  expect(renderSpec(scene, "p")).toMatchObject({
    kind: "point",
    positions: [[1, 2, 3]],
    color: [1, 0, 0, 0.5],
    zIndex: 3,
  });
});
