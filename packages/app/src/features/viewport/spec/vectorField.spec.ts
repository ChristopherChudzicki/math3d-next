import { SceneBuilder } from "@math3d/mock-api";
import { act } from "@testing-library/react";
import {
  renderGraphicSpec,
  trackGraphicSpec,
} from "@/test_util/renderGraphicSpec";
import { actions } from "@/store/scene/state/scene.slice";
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

test("a variable that only styles the field leaves its sampled arrows as they were", () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.variable({ value: { type: "assignment", lhs: "a", rhs: "1" } }, "a");
  folder.vectorField({ opacity: "a" }, "f");
  const { store, specs } = trackGraphicSpec<LineSpec>(scene, "f");
  act(() => {
    store.dispatch(
      actions.patchProperty({
        id: "a",
        path: "/value",
        value: { type: "assignment", lhs: "a", rhs: "0.5" },
      }),
    );
  });
  expect(specs.map(({ color }) => color[3])).toEqual([1, 0.5]);
  expect(specs[1].paths).toBe(specs[0].paths);
});
