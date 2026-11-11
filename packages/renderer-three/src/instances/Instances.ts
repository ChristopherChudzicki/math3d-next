import {
  BufferAttribute,
  InstancedBufferGeometry,
  InstancedInterleavedBuffer,
  InterleavedBufferAttribute,
  Mesh,
} from "three/webgpu";
import type { Material } from "three/webgpu";

/** The mesh every instance draws: its vertices, as xyz triples, and its triangles. */
export type Template = { positions: number[]; index: number[] };

/** Per-instance attributes in buffer order, as `[name, floats]`. */
export type Layout = readonly (readonly [name: string, size: number])[];

/** Floats per instance. */
export const strideOf = (layout: Layout): number =>
  layout.reduce((sum, [, size]) => sum + size, 0);

type InstancedMesh = Mesh<InstancedBufferGeometry, Material>;

/**
 * Meshes, one per material, that each draw `template` once per instance from
 * one buffer. The per-instance floats refill in place; the buffer is replaced
 * only when the instances outgrow it.
 */
export class Instances {
  readonly meshes: readonly InstancedMesh[];

  /** The first of `meshes`. */
  readonly mesh: InstancedMesh;

  private readonly stride: number;

  private buffer: InstancedInterleavedBuffer | null = null;

  constructor(
    private readonly template: Template,
    private readonly layout: Layout,
    materials: Material | readonly [Material, ...Material[]],
  ) {
    this.stride = strideOf(layout);
    const geometry = new InstancedBufferGeometry();
    this.meshes = ([] as Material[]).concat(materials).map((material) => {
      const mesh = new Mesh(geometry, material);
      // The shader places every vertex, so the geometry's bounds say nothing.
      mesh.frustumCulled = false;
      mesh.visible = false;
      return mesh;
    });
    [this.mesh] = this.meshes;
  }

  /** How many instances fit without replacing the buffer. */
  get capacity(): number {
    return this.buffer ? this.buffer.array.length / this.stride : 0;
  }

  /**
   * Draws what `write` puts in the buffer: it gets room for `maxCount`
   * instances and returns how many it wrote.
   */
  fill(maxCount: number, write: (out: Float32Array) => number): void {
    if (maxCount > this.capacity) {
      this.allocate(Math.max(maxCount, 2 * this.capacity));
    }
    const { buffer } = this;
    const count = buffer ? write(buffer.array as Float32Array) : 0;
    if (count > maxCount) {
      throw new Error(`Wrote ${count} instances into room for ${maxCount}.`);
    }
    if (buffer && count > 0) {
      buffer.clearUpdateRanges();
      buffer.addUpdateRange(0, count * this.stride);
      buffer.needsUpdate = true;
    }
    this.mesh.geometry.instanceCount = count;
    this.meshes.forEach((mesh) => {
      // eslint-disable-next-line no-param-reassign
      mesh.visible = count > 0;
    });
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    // Releases what the renderer keeps per mesh; the materials are shared and
    // stay.
    this.meshes.forEach((mesh) => mesh.dispose());
  }

  /** A new geometry, since a GPU buffer can't grow; disposing the old one frees its buffer. */
  private allocate(capacity: number): void {
    const { template, layout, stride } = this;
    this.mesh.geometry.dispose();
    const geometry = new InstancedBufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(template.positions), 3),
    );
    geometry.setIndex(template.index);
    const buffer = new InstancedInterleavedBuffer(
      new Float32Array(capacity * stride),
      stride,
    );
    let offset = 0;
    layout.forEach(([name, size]) => {
      geometry.setAttribute(
        name,
        new InterleavedBufferAttribute(buffer, size, offset),
      );
      offset += size;
    });
    this.buffer = buffer;
    this.meshes.forEach((mesh) => {
      // eslint-disable-next-line no-param-reassign
      mesh.geometry = geometry;
    });
  }
}
