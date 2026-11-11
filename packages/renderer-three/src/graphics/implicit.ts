import { Group } from "three/webgpu";
import type { ImplicitSurfaceSpec } from "@math3d/viewport-spec";
import { TriangleMesh } from "../mesh/TriangleMesh";
import { freeMeshBuffers, marchingCubes } from "../mesh/marchingCubes";
import { freeGridBuffer, sampleScalarGrid } from "../mesh/scalarGrid";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";

/**
 * Per-axis cell cap. Sampling evaluates the surface's equation (cells + 1)³
 * times, on the main thread: about a second at 128.
 */
export const MAX_IMPLICIT_CELLS = 128;

/** Whether two specs sample the same field at the same points. */
const sameField = (a: ImplicitSurfaceSpec, b: ImplicitSurfaceSpec) =>
  a.value === b.value &&
  a.samples === b.samples &&
  a.domain.every(
    ([lo, hi], axis) => lo === b.domain[axis][0] && hi === b.domain[axis][1],
  );

/** Implicit surfaces: the zero level set of the spec's `value`. */
export const buildImplicit = (
  spec: ImplicitSurfaceSpec,
  transparency: Transparency,
): Graphic<ImplicitSurfaceSpec> => {
  const surface = new TriangleMesh(transparency);
  let drawn: ImplicitSurfaceSpec | null = null;
  let vertexCount = 0;
  let indexCount = 0;
  const set = (next: ImplicitSurfaceSpec) => {
    // The same field again: its mesh is already in the surface's buffers.
    const mesh =
      drawn && sameField(drawn, next)
        ? null
        : marchingCubes(
            sampleScalarGrid(
              Math.min(next.samples, MAX_IMPLICIT_CELLS),
              next.domain,
              next.value,
            ),
          );
    if (mesh) ({ vertexCount, indexCount } = mesh);
    surface.fill(vertexCount, indexCount, next, (out) => {
      if (mesh) {
        out.position.set(mesh.position.subarray(0, 3 * vertexCount));
        out.normal.set(mesh.normal.subarray(0, 3 * vertexCount));
        out.index.set(mesh.index.subarray(0, indexCount));
      }
      for (let k = 0; k < vertexCount; k += 1) out.color.set(next.color, 4 * k);
    });
    drawn = next;
  };
  set(spec);
  return {
    object: new Group().add(surface.mesh),
    update: set,
    dispose: () => {
      surface.dispose();
      // The meshing buffers only grow, to megabytes at the cell cap. Another
      // surface's next remesh allocates them anew.
      freeGridBuffer();
      freeMeshBuffers();
    },
  };
};
