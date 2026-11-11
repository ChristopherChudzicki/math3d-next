import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  Sphere,
  Vector3,
} from "three/webgpu";
import type { Material } from "three/webgpu";
import type { Transparency } from "../shader/material";
import { MeshUniforms, meshMaterial } from "./meshMaterial";
import type { MeshStyle } from "./meshMaterial";

/** The buffers `TriangleMesh.fill` hands its writer, in the mesh's coordinates. */
export type MeshBuffers = {
  /** xyz per vertex. */
  position: Float32Array;
  /** xyz per vertex: zero where there is none, which lights as view-space up. */
  normal: Float32Array;
  /** RGBA per vertex, as given: no color-space conversion. */
  color: Float32Array;
  /** Three vertex indices per triangle. */
  index: Uint32Array;
};

const ATTRIBUTES = [
  ["position", 3],
  ["normal", 3],
  ["color", 4],
] as const;

const markWritten = (attribute: BufferAttribute, count: number) => {
  attribute.clearUpdateRanges();
  if (count === 0) return;
  attribute.addUpdateRange(0, count);
  // eslint-disable-next-line no-param-reassign
  attribute.needsUpdate = true;
};

/**
 * Triangles drawn with `meshMaterial`. Their buffers refill in place and are
 * replaced only when a fill outgrows them.
 */
export class TriangleMesh {
  readonly mesh: Mesh<BufferGeometry, Material>;

  private readonly uniforms = new MeshUniforms();

  private vertexCapacity = 0;

  private indexCapacity = 0;

  constructor(private readonly transparency: Transparency) {
    this.mesh = new Mesh(
      new BufferGeometry(),
      meshMaterial(true, "opaque", transparency),
    );
    this.mesh.userData.mesh = this.uniforms;
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /**
   * Draws what `write` puts in buffers with room for `vertexCount` vertices
   * and `indexCount` indices. Any vertex with alpha below 1 makes the whole
   * mesh translucent. The buffers hold what the last fill wrote, unless this
   * one needs more room than any before it.
   */
  fill(
    vertexCount: number,
    indexCount: number,
    style: MeshStyle,
    write: (buffers: MeshBuffers) => void,
  ): void {
    if (indexCount === 0) {
      this.mesh.visible = false;
      return;
    }
    if (vertexCount > this.vertexCapacity || indexCount > this.indexCapacity) {
      this.allocate(
        Math.max(vertexCount, 2 * this.vertexCapacity),
        Math.max(indexCount, 2 * this.indexCapacity),
      );
    }
    const { geometry } = this.mesh;
    const attribute = (name: string) =>
      geometry.getAttribute(name) as BufferAttribute;
    const index = geometry.getIndex() as BufferAttribute;
    const color = attribute("color").array as Float32Array;
    write({
      position: attribute("position").array as Float32Array,
      normal: attribute("normal").array as Float32Array,
      color,
      index: index.array as Uint32Array,
    });
    let translucent = false;
    for (let k = 3; k < 4 * vertexCount && !translucent; k += 4) {
      translucent = color[k] < 1;
    }
    ATTRIBUTES.forEach(([name, size]) =>
      markWritten(attribute(name), vertexCount * size),
    );
    markWritten(index, indexCount);
    geometry.setDrawRange(0, indexCount);
    this.uniforms.set(style);
    this.mesh.material = meshMaterial(
      style.shaded,
      translucent ? "translucent" : "opaque",
      this.transparency,
    );
    this.mesh.visible = true;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    // Releases what the renderer keeps per mesh; the material is shared.
    this.mesh.dispose();
  }

  /** A new geometry, since a GPU buffer can't grow. */
  private allocate(vertices: number, indices: number): void {
    this.mesh.geometry.dispose();
    const geometry = new BufferGeometry();
    ATTRIBUTES.forEach(([name, size]) =>
      geometry.setAttribute(
        name,
        new BufferAttribute(new Float32Array(size * vertices), size),
      ),
    );
    geometry.setIndex(new BufferAttribute(new Uint32Array(indices), 1));
    // three sorts by bounds it computes once, over the whole buffer, and
    // logs an error when a NaN sample makes them NaN.
    geometry.boundingSphere = new Sphere(new Vector3(), Infinity);
    this.mesh.geometry = geometry;
    this.vertexCapacity = vertices;
    this.indexCapacity = indices;
  }
}
