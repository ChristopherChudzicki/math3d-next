import { describe, expect, test, vi } from "vitest";
import { NormalBlending } from "three/webgpu";
import type { BufferAttribute } from "three/webgpu";
import { TriangleMesh } from "./TriangleMesh";
import type { MeshBuffers } from "./TriangleMesh";
import type { MeshStyle } from "./meshMaterial";

const style: MeshStyle = { shaded: true, zBias: 3, zIndex: 1 };

/** Fills `triangles` triangles of three vertices each, every color at `alpha`. */
const fill = (
  mesh: TriangleMesh,
  triangles: number,
  { alpha = 1, given = style } = {},
) =>
  mesh.fill(3 * triangles, 3 * triangles, given, (out: MeshBuffers) => {
    out.position.fill(1, 0, 9 * triangles);
    out.color.fill(alpha, 0, 12 * triangles);
    out.index.set(Array.from({ length: 3 * triangles }, (_, k) => k));
  });

const attribute = (mesh: TriangleMesh, name: string) =>
  mesh.mesh.geometry.getAttribute(name) as BufferAttribute;

describe("TriangleMesh", () => {
  test("refills its buffers in place while they fit, and draws only what was written", () => {
    const mesh = new TriangleMesh("oit", "glossy");
    fill(mesh, 10);
    const { geometry } = mesh.mesh;
    const positions = attribute(mesh, "position").array;
    fill(mesh, 4);
    expect(mesh.mesh.geometry).toBe(geometry);
    expect(attribute(mesh, "position").array).toBe(positions);
    expect(geometry.drawRange.count).toBe(12);
    expect(attribute(mesh, "position").updateRanges).toEqual([
      { start: 0, count: 36 },
    ]);
  });

  test("replaces and disposes its geometry when a fill outgrows it, at least doubling", () => {
    const mesh = new TriangleMesh("oit", "glossy");
    fill(mesh, 4);
    const old = mesh.mesh.geometry;
    const disposed = vi.fn();
    old.addEventListener("dispose", disposed);
    fill(mesh, 5);
    expect(disposed).toHaveBeenCalled();
    expect(attribute(mesh, "position").count).toBe(24);
    expect(mesh.mesh.geometry.getIndex()?.count).toBe(24);
    expect(mesh.mesh.geometry.drawRange.count).toBe(15);
  });

  test("never computes bounds, which a NaN sample would make NaN", () => {
    const mesh = new TriangleMesh("oit", "glossy");
    fill(mesh, 1);
    expect(mesh.mesh.geometry.boundingSphere?.radius).toBe(Infinity);
  });

  test("blends when any vertex is translucent", () => {
    const mesh = new TriangleMesh("oit", "glossy");
    mesh.fill(3, 3, style, (out) => {
      out.color.fill(1, 0, 12);
      out.color.set([0.5], 11);
      out.index.set([0, 1, 2]);
    });
    expect(mesh.mesh.material.transparent).toBe(true);
    fill(mesh, 1);
    expect(mesh.mesh.material.transparent).toBe(false);
  });

  test("under the ordered model, blends an opaque mesh too", () => {
    const mesh = new TriangleMesh("ordered", "glossy");
    fill(mesh, 1);
    expect(mesh.mesh.material).toMatchObject({
      transparent: true,
      blending: NormalBlending,
      depthWrite: true,
    });
  });

  test("shares one material per shading and transparency", () => {
    const [shaded, alsoShaded, flat] = [0, 1, 2].map(
      () => new TriangleMesh("oit", "glossy"),
    );
    fill(shaded, 1);
    fill(alsoShaded, 1);
    fill(flat, 1, { given: { ...style, shaded: false } });
    expect(shaded.mesh.material).toBe(alsoShaded.mesh.material);
    expect(flat.mesh.material).not.toBe(shaded.mesh.material);
  });

  test("lights a matte mesh with its own material, but draws an unshaded one alike", () => {
    const [glossy, matte] = (["glossy", "matte"] as const).map(
      (shading) => new TriangleMesh("oit", shading),
    );
    fill(glossy, 1);
    fill(matte, 1);
    expect(matte.mesh.material).not.toBe(glossy.mesh.material);
    const unshaded = { given: { ...style, shaded: false } };
    fill(glossy, 1, unshaded);
    fill(matte, 1, unshaded);
    expect(matte.mesh.material).toBe(glossy.mesh.material);
  });

  test("puts its depth style at userData.mesh for the material", () => {
    const mesh = new TriangleMesh("oit", "glossy");
    fill(mesh, 1);
    const given = { ...style, zBias: -2, zIndex: 0 };
    fill(mesh, 1, { given });
    expect({ ...mesh.mesh.userData.mesh }).toEqual({
      zBias: given.zBias,
      zIndex: given.zIndex,
    });
  });

  test("draws nothing without triangles, before or after a fill", () => {
    const mesh = new TriangleMesh("oit", "glossy");
    fill(mesh, 0);
    expect(mesh.mesh.visible).toBe(false);
    fill(mesh, 1);
    fill(mesh, 0);
    expect(mesh.mesh.visible).toBe(false);
  });
});
