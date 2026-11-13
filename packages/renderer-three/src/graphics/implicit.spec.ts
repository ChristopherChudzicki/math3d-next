import { afterEach, describe, expect, test } from "vitest";
import type { BufferAttribute, Mesh } from "three/webgpu";
import type { ImplicitSurfaceSpec } from "@math3d/viewport-spec";
import { sampleScalarGrid } from "../mesh/scalarGrid";
import { MAX_IMPLICIT_CELLS, buildImplicit } from "./implicit";

/** A unit sphere, and how many times it has been evaluated. */
const countedSphere = () => {
  const counted = {
    calls: 0,
    value: (x: number, y: number, z: number) => {
      counted.calls += 1;
      return x * x + y * y + z * z - 1;
    },
  };
  return counted;
};

const implicitSpec = (
  overrides: Partial<ImplicitSurfaceSpec> = {},
): ImplicitSurfaceSpec => ({
  kind: "implicit",
  domain: [
    [-2, 2],
    [-2, 2],
    [-2, 2],
  ],
  samples: 8,
  value: countedSphere().value,
  color: [0.2, 0.4, 0.6, 1],
  shaded: true,
  zBias: 2,
  zIndex: 1,
  ...overrides,
});

type Implicit = ReturnType<typeof buildImplicit>;

const built: Implicit[] = [];
/** Builds a surface that is disposed after the test. */
const build = (spec: ImplicitSurfaceSpec): Implicit => {
  built.push(buildImplicit(spec, "oit", "glossy"));
  return built[built.length - 1];
};
afterEach(() => built.splice(0).forEach((graphic) => graphic.dispose()));

const meshOf = (graphic: Implicit) => graphic.object.children[0] as Mesh;

const colorOf = (mesh: Mesh, vertex: number) => {
  const colors = mesh.geometry.getAttribute("color") as BufferAttribute;
  return Array.from(colors.array.subarray(4 * vertex, 4 * vertex + 4));
};

describe("buildImplicit", () => {
  test("draws the level set in the spec's color and depth style", () => {
    const spec = implicitSpec({ color: [0.25, 0.5, 0.75, 0.5] });
    const mesh = meshOf(build(spec));
    expect(mesh.visible).toBe(true);
    expect(mesh.geometry.drawRange.count).toBeGreaterThan(0);
    expect(colorOf(mesh, 0)).toEqual(spec.color);
    expect(mesh.material).toMatchObject({ transparent: true });
    expect(mesh.userData.mesh).toMatchObject({ zBias: 2, zIndex: 1 });
    expect(mesh.userData.mesh.gridLines.toArray()).toEqual([0, 0]);
  });

  test("samples the corners of `samples` cells per axis, up to the cap", () => {
    const few = countedSphere();
    build(implicitSpec({ samples: 8, value: few.value }));
    expect(few.calls).toBe(9 ** 3);
    const many = countedSphere();
    build(implicitSpec({ samples: MAX_IMPLICIT_CELLS + 1, value: many.value }));
    expect(many.calls).toBe((MAX_IMPLICIT_CELLS + 1) ** 3);
  });

  test("restyles the same field without sampling it again", () => {
    const sphere = countedSphere();
    const spec = implicitSpec({ value: sphere.value });
    const graphic = build(spec);
    const mesh = meshOf(graphic);
    const { count } = mesh.geometry.drawRange;
    const { calls } = sphere;
    const color: ImplicitSurfaceSpec["color"] = [1, 0, 0, 1];
    graphic.update({ ...spec, color, domain: [...spec.domain] });
    expect(sphere.calls).toBe(calls);
    expect(mesh.geometry.drawRange.count).toBe(count);
    expect(colorOf(mesh, 0)).toEqual(color);
    expect(mesh.material).toMatchObject({ transparent: false });
  });

  test.each<[string, (spec: ImplicitSurfaceSpec) => ImplicitSurfaceSpec]>([
    ["value", (spec) => ({ ...spec, value: (x, y, z) => spec.value(x, y, z) })],
    ["samples", (spec) => ({ ...spec, samples: 12 })],
    [
      "domain",
      (spec) => ({
        ...spec,
        domain: spec.domain.map(([lo, hi]) => [
          lo,
          hi + 1,
        ]) as ImplicitSurfaceSpec["domain"],
      }),
    ],
  ])("remeshes in place when %s changes", (_, change) => {
    const sphere = countedSphere();
    const spec = implicitSpec({ value: sphere.value });
    const graphic = build(spec);
    const mesh = meshOf(graphic);
    const { calls } = sphere;
    const next = change(spec);
    graphic.update(next);
    expect(meshOf(graphic)).toBe(mesh);
    expect(sphere.calls - calls).toBe((next.samples + 1) ** 3);
  });

  test("draws nothing when the field never crosses zero", () => {
    const graphic = build(implicitSpec());
    graphic.update(implicitSpec({ value: () => 1 }));
    expect(meshOf(graphic).visible).toBe(false);
  });

  test("frees the meshing buffers when a surface is disposed", () => {
    const spec = implicitSpec();
    buildImplicit(spec, "oit", "glossy").dispose();
    // A one-cell grid is sampled into a buffer of its own size.
    const grid = sampleScalarGrid(1, spec.domain, () => 0);
    expect(grid.values.length).toBe(8);
  });
});
