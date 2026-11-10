import { BufferAttribute, BufferGeometry, Mesh } from "three/webgpu";
import type { RGBA } from "@math3d/viewport-spec";
import { writeColors, writeIndex, writeNormals, writePositions } from "./grid";
import type { Grid } from "./grid";
import { MeshUniforms, meshMaterial } from "./meshMaterial";

type Style = {
  colorAt: (u: number, v: number) => RGBA;
  shaded: boolean;
  zBias: number;
  zIndex: number;
};

/**
 * A sampled grid drawn as triangles. It refills its buffers in place and
 * replaces them only when a grid has more points than they hold.
 */
export class GridMesh {
  readonly mesh = new Mesh(new BufferGeometry(), meshMaterial(true, false));

  private readonly uniforms = new MeshUniforms();

  private capacity = 0;

  private shape: [cols: number, rows: number] = [0, 0];

  constructor() {
    this.mesh.userData.mesh = this.uniforms;
    // NaN samples would make the bounds NaN, and computing them costs a pass.
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  set(grid: Grid, style: Style): void {
    const { cols, rows } = grid;
    if (cols < 2 || rows < 2) {
      this.mesh.visible = false;
      return;
    }
    const count = cols * rows;
    if (count > this.capacity)
      this.allocate(Math.max(count, 2 * this.capacity));
    const { geometry } = this.mesh;
    const position = geometry.getAttribute("position") as BufferAttribute;
    const normal = geometry.getAttribute("normal") as BufferAttribute;
    const color = geometry.getAttribute("color") as BufferAttribute;
    writePositions(grid, position.array as Float32Array);
    writeNormals(grid, normal.array as Float32Array);
    const translucent = writeColors(
      grid,
      style.colorAt,
      color.array as Float32Array,
    );
    [position, normal, color].forEach((attribute) => {
      attribute.clearUpdateRanges();
      attribute.addUpdateRange(0, count * attribute.itemSize);
      // eslint-disable-next-line no-param-reassign
      attribute.needsUpdate = true;
    });
    if (cols !== this.shape[0] || rows !== this.shape[1]) {
      const index = geometry.getIndex() as BufferAttribute;
      const indexCount = writeIndex(cols, rows, index.array as Uint32Array);
      index.clearUpdateRanges();
      index.addUpdateRange(0, indexCount);
      index.needsUpdate = true;
      geometry.setDrawRange(0, indexCount);
      this.shape = [cols, rows];
    }
    this.uniforms.set(style);
    this.mesh.material = meshMaterial(style.shaded, translucent);
    this.mesh.visible = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    // Releases what the renderer keeps per mesh; the material is shared.
    this.mesh.dispose();
  }

  /** A new geometry, since a GPU buffer can't grow. */
  private allocate(capacity: number): void {
    this.mesh.geometry.dispose();
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(3 * capacity), 3),
    );
    geometry.setAttribute(
      "normal",
      new BufferAttribute(new Float32Array(3 * capacity), 3),
    );
    geometry.setAttribute(
      "color",
      new BufferAttribute(new Float32Array(4 * capacity), 4),
    );
    // A grid has fewer cells than points, so 6 indices per point suffice.
    geometry.setIndex(new BufferAttribute(new Uint32Array(6 * capacity), 1));
    this.mesh.geometry = geometry;
    this.capacity = capacity;
    this.shape = [0, 0];
  }
}
