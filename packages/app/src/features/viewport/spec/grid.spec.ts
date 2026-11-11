import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";

test("a grid spans its axes' ranges and divides them evenly", () => {
  const scene = new SceneBuilder()
    .axis("z", { min: "0", max: "2" })
    .grid("zx", { visible: true, divisions: "[4, 4]" });
  expect(renderGraphicSpec(scene, "grid-zx")).toMatchObject({
    range: [
      [0, 2],
      [-5, 5],
    ],
    values: [
      [0, 0.5, 1, 1.5, 2],
      [-5, -2.5, 0, 2.5, 5],
    ],
  });
});

test("a snapped grid's lines fall on round values", () => {
  const scene = new SceneBuilder().grid("xy", {
    divisions: "[4, 4]",
    snap: "true",
  });
  expect(renderGraphicSpec(scene, "grid-xy")).toMatchObject({
    values: [
      [-5, 0, 5],
      [-5, 0, 5],
    ],
  });
});
