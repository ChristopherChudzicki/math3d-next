import { CELL_TRIANGLES } from "./marchingCubesTable";
import { writeGradient } from "./scalarGrid";
import type { ScalarGrid } from "./scalarGrid";

/** An indexed triangle mesh, in buffers that may be longer than the mesh. */
export type IsoMesh = {
  vertexCount: number;
  indexCount: number;
  /** xyz per vertex. */
  position: Float32Array;
  /** Unit xyz per vertex; zero where the grid gives no finite, nonzero gradient. */
  normal: Float32Array;
  /** Three vertex indices per triangle. */
  index: Uint32Array;
};

/** Every case's triangles as edge numbers, case `c` at `CASE_START[c]` up to `CASE_START[c + 1]`. */
const CASE_EDGES = Uint8Array.from(CELL_TRIANGLES.flat());
const CASE_START = new Uint16Array(257);
CELL_TRIANGLES.forEach((edges, c) => {
  CASE_START[c + 1] = CASE_START[c] + edges.length;
});

// The edge-vertex buffer's slices, one entry per grid point of a plane: the
// vertices on a cell layer's lower plane's x and y edges, on its upper
// plane's, and on the z edges between.
const LOWER = 0;
const UPPER = 2;
const ALONG_Z = 4;
/**
 * Each cell edge as [slice, i step, j step]: the slice that holds its vertex,
 * and the grid point it starts from, relative to the cell's corner 0.
 */
const EDGES = [
  [LOWER, 0, 0],
  [LOWER + 1, 1, 0],
  [LOWER, 0, 1],
  [LOWER + 1, 0, 0],
  [UPPER, 0, 0],
  [UPPER + 1, 1, 0],
  [UPPER, 0, 1],
  [UPPER + 1, 0, 0],
  [ALONG_Z, 0, 0],
  [ALONG_Z, 1, 0],
  [ALONG_Z, 1, 1],
  [ALONG_Z, 0, 1],
] as const;

// One set of buffers for every mesh: a caller copies its mesh out before the
// next is built.
let position = new Float32Array(0);
let normal = new Float32Array(0);
let index = new Uint32Array(0);
let edgeVertex = new Int32Array(0);
const gradients = new Float64Array(6);
const edgeAt = new Int32Array(12);

/** Frees the buffers meshes are built in; the next mesh allocates anew. */
export const freeMeshBuffers = (): void => {
  position = new Float32Array(0);
  normal = new Float32Array(0);
  index = new Uint32Array(0);
  edgeVertex = new Int32Array(0);
};

const grown = <T extends Float32Array | Uint32Array>(
  buffer: T,
  length: number,
): T => {
  if (buffer.length >= length) return buffer;
  const Kind = buffer.constructor as new (size: number) => T;
  const next = new Kind(Math.max(length, 2 * buffer.length));
  next.set(buffer);
  return next;
};

/**
 * The zero level set of a sampled field as an indexed mesh: one vertex per
 * grid edge whose ends differ in sign, shared by the cells around it, with
 * the grid's gradient as its normal. Triangles wind counterclockwise seen
 * from the positive side. A zero counts as negative; a cell with a
 * non-finite corner has no triangles.
 *
 * The mesh's buffers are overwritten by the next call.
 */
export const marchingCubes = (grid: ScalarGrid): IsoMesh => {
  const {
    size: [nx, ny, nz],
    origin,
    spacing,
    values,
  } = grid;
  const plane = nx * ny;
  if (edgeVertex.length < 5 * plane) edgeVertex = new Int32Array(5 * plane);
  let vertexCount = 0;
  let indexCount = 0;

  /**
   * Adds the vertex on the edge from point (i, j, k), where the field is
   * `a`, one step along `axis` to where it is `b`, and returns its index.
   */
  const addVertex = (
    i: number,
    j: number,
    k: number,
    axis: 0 | 1 | 2,
    a: number,
    b: number,
  ): number => {
    const t = a / (a - b);
    // A non-finite end; every cell around this edge is skipped.
    if (Number.isNaN(t)) return -1;
    const o = 3 * vertexCount;
    position[o] = origin[0] + i * spacing[0];
    position[o + 1] = origin[1] + j * spacing[1];
    position[o + 2] = origin[2] + k * spacing[2];
    position[o + axis] += t * spacing[axis];
    writeGradient(grid, i, j, k, gradients, 0);
    writeGradient(
      grid,
      axis === 0 ? i + 1 : i,
      axis === 1 ? j + 1 : j,
      axis === 2 ? k + 1 : k,
      gradients,
      3,
    );
    const x = gradients[0] + t * (gradients[3] - gradients[0]);
    const y = gradients[1] + t * (gradients[4] - gradients[1]);
    const z = gradients[2] + t * (gradients[5] - gradients[2]);
    const length = Math.sqrt(x * x + y * y + z * z);
    const valid = length > 0 && Number.isFinite(length);
    normal[o] = valid ? x / length : 0;
    normal[o + 1] = valid ? y / length : 0;
    normal[o + 2] = valid ? z / length : 0;
    vertexCount += 1;
    return vertexCount - 1;
  };

  /** Adds plane k's x- and y-edge vertices, kept in `slice` and the next. */
  const addPlane = (k: number, slice: number) => {
    position = grown(position, 3 * (vertexCount + 2 * plane));
    normal = grown(normal, 3 * (vertexCount + 2 * plane));
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const at = i + nx * j;
        const a = values[at + plane * k];
        if (i < nx - 1) {
          const b = values[at + plane * k + 1];
          if (a > 0 !== b > 0) {
            edgeVertex[slice * plane + at] = addVertex(i, j, k, 0, a, b);
          }
        }
        if (j < ny - 1) {
          const b = values[at + plane * k + nx];
          if (a > 0 !== b > 0) {
            edgeVertex[(slice + 1) * plane + at] = addVertex(i, j, k, 1, a, b);
          }
        }
      }
    }
  };

  /** Adds the vertices on the z edges from plane k to the next. */
  const addColumns = (k: number) => {
    position = grown(position, 3 * (vertexCount + plane));
    normal = grown(normal, 3 * (vertexCount + plane));
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        const at = i + nx * j;
        const a = values[at + plane * k];
        const b = values[at + plane * (k + 1)];
        if (a > 0 !== b > 0) {
          edgeVertex[ALONG_Z * plane + at] = addVertex(i, j, k, 2, a, b);
        }
      }
    }
  };

  /** Adds the triangles of the cells between plane k and the next. */
  const addCells = (k: number) => {
    index = grown(index, indexCount + 15 * plane);
    for (let j = 0; j < ny - 1; j += 1) {
      for (let i = 0; i < nx - 1; i += 1) {
        const at = i + nx * j;
        const c = at + plane * k;
        const v0 = values[c];
        const v1 = values[c + 1];
        const v2 = values[c + 1 + nx];
        const v3 = values[c + nx];
        const v4 = values[c + plane];
        const v5 = values[c + plane + 1];
        const v6 = values[c + plane + 1 + nx];
        const v7 = values[c + plane + nx];
        const corners =
          (v0 > 0 ? 1 : 0) +
          (v1 > 0 ? 2 : 0) +
          (v2 > 0 ? 4 : 0) +
          (v3 > 0 ? 8 : 0) +
          (v4 > 0 ? 16 : 0) +
          (v5 > 0 ? 32 : 0) +
          (v6 > 0 ? 64 : 0) +
          (v7 > 0 ? 128 : 0);
        if (
          corners !== 0 &&
          corners !== 255 &&
          Number.isFinite(v0 + v1 + v2 + v3 + v4 + v5 + v6 + v7)
        ) {
          const end = CASE_START[corners + 1];
          for (let t = CASE_START[corners]; t < end; t += 1) {
            index[indexCount] = edgeVertex[edgeAt[CASE_EDGES[t]] + at];
            indexCount += 1;
          }
        }
      }
    }
  };

  // The plane two layers share is the lower one's upper plane and the upper
  // one's lower plane, so its two slices swap roles from layer to layer.
  let lower = LOWER;
  let upper = UPPER;
  addPlane(0, lower);
  for (let k = 0; k < nz - 1; k += 1) {
    addPlane(k + 1, upper);
    addColumns(k);
    for (let e = 0; e < 12; e += 1) {
      const [slice, di, dj] = EDGES[e];
      let held: number = slice;
      if (slice < UPPER) held = lower + slice - LOWER;
      else if (slice < ALONG_Z) held = upper + slice - UPPER;
      edgeAt[e] = held * plane + di + nx * dj;
    }
    addCells(k);
    [lower, upper] = [upper, lower];
  }
  return { vertexCount, indexCount, position, normal, index };
};
