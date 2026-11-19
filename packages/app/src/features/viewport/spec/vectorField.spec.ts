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

const tails = (spec: LineSpec) => spec.paths.map(([tail]) => tail);

test("a sample count that rounds below 1 samples once, at the range minimum", () => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .vectorField({ samples1: "0.4", samples2: "1", samples3: "1" }, "f");
  const spec = renderGraphicSpec(scene, "f") as LineSpec;
  expect(tails(spec)).toEqual([[-5, 0, 0]]);
});

test("a sample count rounds to the nearest integer", () => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .vectorField({ samples1: "0.6", samples2: "1", samples3: "1" }, "f");
  const spec = renderGraphicSpec(scene, "f") as LineSpec;
  expect(tails(spec)).toEqual([[0, 0, 0]]);
});

test("a missing sample count samples once, at the range minimum", () => {
  // A count of 0 fails validation (which warns), so it reaches the spec missing.
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const scene = new SceneBuilder();
  scene
    .folder()
    .vectorField({ samples1: "2", samples2: "1", samples3: "0" }, "f");
  const spec = renderGraphicSpec(scene, "f") as LineSpec;
  expect(tails(spec)).toEqual([
    [-5, 0, -5],
    [5, 0, -5],
  ]);
  expect(warn).toHaveBeenCalled();
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
