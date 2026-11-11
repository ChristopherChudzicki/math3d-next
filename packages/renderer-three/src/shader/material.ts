import { DoubleSide, MeshBasicNodeMaterial } from "three/webgpu";
import type { Node } from "three/webgpu";
import { userData } from "three/tsl";

/**
 * What a mark's alpha is for: `opaque` when it is 1 wherever the mark draws,
 * `translucent` when what lies behind shows through, `edges` when it is below
 * 1 only to antialias the mark's outline.
 */
export type Alpha = "opaque" | "translucent" | "edges";

/** The fact for a mark whose color has that alpha throughout. */
export const alphaOf = (alpha: number): Alpha =>
  alpha < 1 ? "translucent" : "opaque";

/**
 * Whether a mark's triangles all face the same way on screen: a label's or a
 * disc's quad does (`uniform`); a surface's, a cone's and a line's don't
 * (`mixed`).
 */
export type Facing = "uniform" | "mixed";

export type Shader = {
  /** The clip-space position. */
  vertex: Node<"vec4">;
  color: Node<"vec4">;
  /** Fragments where it is false are discarded. */
  mask?: Node;
};

/**
 * The materials for one shader, built on first use and shared by every mesh
 * that draws with it. This alone decides three's blending and depth flags.
 */
export const sharedMaterial = (facing: Facing, build: () => Shader) => {
  const materials = new Map<Alpha, MeshBasicNodeMaterial>();
  return (alpha: Alpha): MeshBasicNodeMaterial => {
    let material = materials.get(alpha);
    if (!material) {
      const { vertex, color, mask } = build();
      material = new MeshBasicNodeMaterial();
      material.vertexNode = vertex;
      material.colorNode = color;
      if (mask) material.maskNode = mask;
      material.transparent = alpha !== "opaque";
      // Every mark writes depth, translucent or not, as MathBox's do.
      material.depthWrite = true;
      // Winding says nothing of which way a mark faces: three reverses a
      // mirrored item's front face, and a line's quads follow their segments.
      material.side = DoubleSide;
      // three draws a blended two-sided mesh twice, back faces then front, as
      // MathBox's three does: a translucent cone shows its far side.
      material.forceSinglePass = facing === "uniform";
      materials.set(alpha, material);
    }
    return material;
  };
};

type NodeType = "float" | "vec2" | "vec4";

/**
 * Reads the properties of the object at `mesh.userData[key]` as nodes, per
 * drawn mesh, so one shared material serves meshes of different styles.
 */
export const uniformsAt =
  <Uniforms>(key: string) =>
  <T extends NodeType>(
    property: Exclude<keyof Uniforms & string, "set">,
    type: T,
    // three's types give `userData` no node type.
  ) =>
    userData(`${key}.${property}`, type) as unknown as Node<T>;
