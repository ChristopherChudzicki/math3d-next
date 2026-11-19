import { act } from "@testing-library/react";
import { SceneBuilder } from "@math3d/mock-api";
import {
  renderGraphicSpec,
  trackGraphicSpec,
} from "@/test_util/renderGraphicSpec";
import { actions } from "@/store/scene/state/scene.slice";
import type { ImplicitSurfaceSpec } from "@math3d/viewport-spec";

test("an implicit surface is the zero level set of lhs − rhs", () => {
  const scene = new SceneBuilder();
  scene.folder().implicitSurface({}, "s");
  const spec = renderGraphicSpec(scene, "s") as ImplicitSurfaceSpec;
  // The defaults: x² + y² = z² + 1.
  expect(spec.value(1, 2, 3)).toBe(5 - 10);
});

test("a variable that only styles the surface leaves the spec's value function as it was", () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.variable({ value: { type: "assignment", lhs: "a", rhs: "1" } }, "a");
  folder.implicitSurface({ opacity: "a" }, "s");
  const { store, specs } = trackGraphicSpec<ImplicitSurfaceSpec>(scene, "s");
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
  expect(specs[1].value).toBe(specs[0].value);
  expect(specs[1].values).toBe(specs[0].values);
  expect(specs[0].values).toBeDefined();
});

test("a surface whose equation uses vectors has no `values`", () => {
  const scene = new SceneBuilder();
  scene.folder().implicitSurface(
    {
      lhs: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "\\left[x,y,z\\right]\\cdot\\left[x,y,z\\right]",
      },
    },
    "s",
  );
  const spec = renderGraphicSpec(scene, "s") as ImplicitSurfaceSpec;
  expect(spec.value(1, 2, 3)).toBe(14 - 10);
  expect(spec.values).toBeUndefined();
});

test("`values` declines where a side of the equation isn't a number", () => {
  const scene = new SceneBuilder();
  scene.folder().implicitSurface(
    {
      lhs: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "\\sqrt{x}",
      },
    },
    "s",
  );
  const { values } = renderGraphicSpec(scene, "s") as ImplicitSurfaceSpec;
  const zeros = new Float64Array(2);
  expect(values?.(Float64Array.of(4, 9), zeros, zeros)).toEqual(
    Float64Array.of(1, 2),
  );
  expect(values?.(Float64Array.of(4, -1), zeros, zeros)).toBeUndefined();
});
