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

/** The color a renderer draws at (U, V): `colorAt` of the point sampled there. */
const colorAt = (spec: SurfaceSpec, U: number, V: number) =>
  spec.colorAt(U, V, spec.position(U, V));

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
  const [r, g, b] = gradients.rainbow.getRGB(1.5 / 4);
  expect(colorAt(spec, 0.5, 0.5)).toEqual([
    r,
    g,
    b,
    Number(item.properties.opacity),
  ]);
  // MathBox's default line color.
  expect(spec.grid.color.slice(0, 3)).toEqual([0.5, 0.5, 0.5]);
});

/** The samples of a grid over [0, 1]² where `positions` and `position` differ. */
const positionMismatches = (spec: SurfaceSpec, cols = 4, rows = 3) => {
  const samples = Array.from({ length: cols * rows }, (_, k) => [
    (k % cols) / (cols - 1),
    Math.floor(k / cols) / (rows - 1),
  ]);
  const columns = spec.positions?.(
    Float64Array.from(samples, ([U]) => U),
    Float64Array.from(samples, ([, V]) => V),
  );
  invariant(columns, "No positions, or it declined.");
  return samples.flatMap(([U, V], k) => {
    const expected = spec.position(U, V);
    const actual = columns.map((column) => column[k]);
    return expected.every((x, c) => Object.is(actual[c], x))
      ? []
      : [{ U, V, actual, expected }];
  });
};

test("positions gives position's points where one range depends on the other parameter", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface(
    {
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
    },
    "s",
  );
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  expect(positionMismatches(spec)).toEqual([]);
});

test("a surface whose function has no batched form has no positions", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface(
    {
      expr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y"],
        rhs: "\\left[x,y\\right]\\cdot\\left[x,y\\right]",
      },
    },
    "s",
  );
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  expect(spec.position(0.5, 0.5)).toHaveLength(3);
  expect(spec.positions).toBeUndefined();
});

test("colorAt colors the point it is given, not the position at its parameters", () => {
  const scene = new SceneBuilder();
  scene.folder().explicitSurface(
    {
      color: "rainbow",
      colorExpr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "z",
      },
    },
    "s",
  );
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
  const z = spec.position(0.5, 0.5)[2] + 0.25;
  expect(spec.colorAt(0.5, 0.5, [0, 0, z]).slice(0, 3)).toEqual(
    gradients.rainbow.getRGB(z),
  );
});

test("a solid-colored surface's gridlines take its gridline color and gridOpacity", () => {
  const scene = new SceneBuilder();
  scene.folder().parametricSurface({ gridOpacity: "0.3" }, "s");
  const item = scene.items.find((x) => x.id === "s");
  invariant(item?.type === MIT.ParametricSurface);
  const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
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
  expect(colorAt(spec, 0.5, 0.5)[3]).toBe(1);
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
  const { getRGB } = gradients.rainbow;
  expect(specs.map((spec) => colorAt(spec, 0, 0).slice(0, 3))).toEqual([
    getRGB(1),
    getRGB(0.5),
  ]);
  expect(specs[1].position).toBe(specs[0].position);
  set("b", "2");
  expect(specs).toHaveLength(3);
  expect(specs[2].position).not.toBe(specs[1].position);
  expect(specs[2].position(0, 0)[2]).toBe(2);
});

describe("mapColor", () => {
  const colorExpr = (rhs: string) => ({
    type: "function-assignment" as const,
    name: "_f",
    params: ["x", "y", "z"],
    rhs,
  });

  test("a gradient surface colored by mod(g, 1) gives the expression's value and its map", () => {
    const scene = new SceneBuilder();
    scene.folder().parametricSurface(
      {
        color: "rainbow",
        colorExpr: {
          type: "function-assignment",
          name: "_f",
          params: ["x", "y", "z", "u", "v"],
          rhs: "mod(u, 1)",
        },
      },
      "s",
    );
    const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
    const [U, V] = [0.9, 0.8];
    const value = spec.mapColor?.valueAt(U, V, spec.position(U, V));
    invariant(value !== undefined);
    expect(spec.mapColor).toEqual({
      // The same function each time, so the renderer's per-map cache holds.
      map: gradients.rainbow.getRGB,
      valueAt: expect.any(Function),
      alpha: colorAt(spec, U, V)[3],
      periodic: true,
    });
    // u is 2.4 there: the surface's own parameter, over its domain [-3, 3].
    expect(value).toBeCloseTo(0.4);
    expect(colorAt(spec, U, V).slice(0, 3)).toEqual(
      gradients.rainbow.getRGB(value),
    );
  });

  test("a gradient without an outer mod gives its value, not periodic", () => {
    const scene = new SceneBuilder();
    scene
      .folder()
      .explicitSurface({ color: "rainbow", colorExpr: colorExpr("z") }, "s");
    const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
    const point = spec.position(0.9, 0.8);
    expect(spec.mapColor?.periodic).toBe(false);
    expect(spec.mapColor?.valueAt(0.9, 0.8, point)).toBe(point[2]);
  });

  test("a solid color has none", () => {
    const scene = new SceneBuilder();
    scene.folder().explicitSurface({}, "s");
    const spec = renderGraphicSpec(scene, "s") as SurfaceSpec;
    expect(spec.mapColor).toBeUndefined();
  });

  test("a scene that defines its own mod is not periodic", () => {
    const scene = new SceneBuilder();
    const folder = scene.folder();
    const g = { type: "assignment" as const, lhs: "g(a, b)", rhs: "0.25" };
    folder.variable({ value: g }, "g");
    folder.explicitSurface(
      { color: "rainbow", colorExpr: colorExpr("mod(z, 1)") },
      "s",
    );
    const { store, specs } = trackGraphicSpec<SurfaceSpec>(scene, "s");
    expect(specs[0].mapColor?.periodic).toBe(true);
    act(() => {
      store.dispatch(
        actions.patchProperty({
          id: "g",
          path: "/value",
          value: { ...g, lhs: "mod(a, b)" },
        }),
      );
    });
    const spec = specs[specs.length - 1];
    expect(spec.mapColor?.periodic).toBe(false);
    expect(colorAt(spec, 0.9, 0.8).slice(0, 3)).toEqual(
      gradients.rainbow.getRGB(0.25),
    );
  });
});
