import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";

test("a vector is an arrow from its tail to tail + components", () => {
  const scene = new SceneBuilder();
  // The default components are [3, 2, 1].
  scene.folder().vector({ tail: "[0, 0, 1]" }, "v");
  expect(renderGraphicSpec(scene, "v")).toMatchObject({
    kind: "line",
    paths: [
      [
        [0, 0, 1],
        [3, 2, 2],
      ],
    ],
    end: true,
  });
});
