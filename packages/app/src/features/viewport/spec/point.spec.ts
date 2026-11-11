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

test("a point's size is the diameter MathBox draws, 1.2 × its stored size", () => {
  const scene = new SceneBuilder();
  scene.folder().point({ size: "10" }, "p");
  expect(renderGraphicSpec(scene, "p")).toMatchObject({ size: 12 });
});

test("a visible point label is its text", () => {
  const scene = new SceneBuilder();
  scene.folder().point({ labelVisible: "true", label: "P" }, "p");
  expect(renderGraphicSpec(scene, "p")).toMatchObject({ label: "P" });
});
