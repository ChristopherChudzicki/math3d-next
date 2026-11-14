import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT, gradients } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { act } from "@testing-library/react";
import {
  renderGraphicSpec,
  trackGraphicSpec,
} from "@/test_util/renderGraphicSpec";
import { actions } from "@/store/scene/state/scene.slice";
import type { SurfaceSpec } from "@math3d/viewport-spec";
import { gridlineColor } from "@/features/viewport/shared/surfaceColor";
import { parseColor } from "./style";

test("an explicit surface maps (U, V) onto its domain and colors by the raw x, y, z, as MathBox does", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface(
    {
      color: "rainbow",
      expr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y"],
        rhs: "x+y",
      },
      // y's range depends on x.
      domain: {
        type: "array",
        items: [
          {
            type: "function-assignment",
            name: "_f",
            params: ["y"],
            rhs: "[0, 2]",
          },
          {
            type: "function-assignment",
            name: "_f",
            params: ["x"],
            rhs: "[0, x]",
          },
        ],
      },
      colorExpr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "\\frac{x+y}{4}",
      },
    },
    "s",
  );
  const item = scene.items.find((x) => x.id === "s");
  invariant(item?.type === MIT.ExplicitSurface);
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;

  expect(spec.position(0.5, 0.5)).toEqual([1, 0.5, 1.5]);
  invariant(spec.color.kind === "map");
  // The same function each time, so the renderer's per-map cache holds.
  expect(spec.color.map).toBe(gradients.rainbow.getRGB);
  expect(spec.color.valueAt(0.5, 0.5, spec.position(0.5, 0.5))).toBe(1.5 / 4);
  expect(spec.color.alpha).toBe(Number(item.properties.opacity));
  expect(spec.color.wrap).toBe(true);
  // MathBox's default line color.
  expect(spec.grid.color.slice(0, 3)).toEqual([0.5, 0.5, 0.5]);
});

test("a solid-colored surface's gridlines take its gridline color and gridOpacity", () => {
  const scene = new SceneBuilder();
  scene.folder().parametricSurface({ gridOpacity: "0.3" }, "s");
  const item = scene.items.find((x) => x.id === "s");
  invariant(item?.type === MIT.ParametricSurface);
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  expect(spec.color).toEqual({ kind: "solid", rgba: expect.any(Array) });
  expect(spec.grid.color).toEqual(
    parseColor(gridlineColor(item.properties.color), 0.3),
  );
});

test("0 gridlines along a parameter draws none along it", () => {
  const scene = new SceneBuilder();
  scene.folder().parametricSurface({ grid1: "0" }, "s");
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  expect(spec.grid.lines[0]).toBe(0);
});

test("1 gridline along a parameter draws 2, its edges", () => {
  const scene = new SceneBuilder();
  scene.folder().parametricSurface({ grid1: "1" }, "s");
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  expect(spec.grid.lines[0]).toBe(2);
});

test("a gradient surface clamps opacity to 1, like a flat color", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface({ color: "rainbow", opacity: "1.5" }, "s");
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  invariant(spec.color.kind === "map");
  expect(spec.color.alpha).toBe(1);
});

test("the spec's position function is new only when a variable the position uses changes", () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.variable({ value: { type: "assignment", lhs: "a", rhs: "1" } }, "a");
  folder.variable({ value: { type: "assignment", lhs: "b", rhs: "1" } }, "b");
  folder.explicitSurface(
    {
      color: "rainbow",
      expr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y"],
        rhs: "b",
      },
      colorExpr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "a",
      },
    },
    "s",
  );
  const { store, specs } = trackGraphicSpec<SurfaceSpec>(scene, "s");
  const set = (id: string, rhs: string) =>
    act(() => {
      store.dispatch(
        actions.patchProperty({
          id,
          path: "/value",
          value: { type: "assignment", lhs: id, rhs },
        }),
      );
    });
  set("a", "0.5");
  const values = specs.map(({ color, position }) => {
    invariant(color.kind === "map");
    return color.valueAt(0, 0, position(0, 0));
  });
  expect(values).toEqual([1, 0.5]);
  expect(specs[1].position).toBe(specs[0].position);
  set("b", "2");
  expect(specs).toHaveLength(3);
  expect(specs[2].position).not.toBe(specs[1].position);
  expect(specs[2].position(0, 0)[2]).toBe(2);
});

test.each([
  { wrapColors: "false", wrap: false },
  // An invalid expression evaluates to nothing, which clamps.
  { wrapColors: "1+", wrap: false },
])(
  "a gradient surface with wrapColors $wrapColors has wrap $wrap",
  ({ wrapColors, wrap }) => {
    const scene = new SceneBuilder();
    scene.folder().explicitSurface({ color: "rainbow", wrapColors }, "s");
    const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
    invariant(spec.color.kind === "map");
    expect(spec.color.wrap).toBe(wrap);
  },
);
