import {
  CustomBlending,
  DoubleSide,
  MeshBasicNodeMaterial,
  NormalBlending,
  OneFactor,
  OneMinusSrcAlphaFactor,
  SrcAlphaFactor,
} from "three/webgpu";
import type { Material, Node } from "three/webgpu";
import { userData } from "three/tsl";

/**
 * Whether what lies behind a mark shows through it: `opaque` when its alpha
 * is 1 wherever it draws, `translucent` otherwise.
 */
export type Opacity = "opaque" | "translucent";

/** The `Opacity` of a mark whose color has this alpha everywhere. */
export const opacityOf = (alpha: number): Opacity =>
  alpha < 1 ? "translucent" : "opaque";

/**
 * What a mark's alpha is for: an `Opacity`, or `edges` when it is below 1
 * only to antialias the mark's outline.
 */
type Alpha = Opacity | "edges";

/**
 * Whether a mark's triangles all face the same way on screen: a label's or a
 * disc's quad does (`uniform`); a surface's, a cone's and a line's don't
 * (`mixed`).
 */
type Facing = "uniform" | "mixed";

/**
 * How translucent marks combine.
 *
 * - `oit`: order-independent. Opaque marks draw first, then `edges` marks
 *   blend over them in draw order, and `OitFrame` composites every
 *   `translucent` fragment in front of those, whatever the order.
 * - `ordered`: MathBox's way. Every mark blends and writes depth, in draw
 *   order, so a translucent mark hides anything drawn later that lies behind
 *   it.
 */
export type Transparency = "oit" | "ordered";

export type Shader = {
  /** The clip-space position. */
  vertex: Node<"vec4">;
  color: Node<"vec4">;
  /** Fragments where it is false are discarded. */
  mask?: Node;
};

const setOitFlags = (material: MeshBasicNodeMaterial, alpha: Alpha) => {
  /* eslint-disable no-param-reassign */
  // three's opaque pass, then its blended one: an antialiased edge never
  // blends with the background where an opaque mark is yet to be drawn.
  material.transparent = alpha !== "opaque";
  if (alpha === "edges") {
    // `accumulates` takes every material with three's `NormalBlending`. These
    // are its factors under another name, so an edge blends in place.
    material.blending = CustomBlending;
    material.blendSrc = SrcAlphaFactor;
    material.blendDst = OneMinusSrcAlphaFactor;
    material.blendSrcAlpha = OneFactor;
  }
  // An accumulating fragment hides nothing: any order gives one picture.
  material.depthWrite = alpha !== "translucent";
  // Order-independent, so three's back-then-front passes would add nothing.
  material.forceSinglePass = true;
  /* eslint-enable no-param-reassign */
};

const setOrderedFlags = (
  material: MeshBasicNodeMaterial,
  alpha: Alpha,
  facing: Facing,
) => {
  /* eslint-disable no-param-reassign */
  // MathBox makes every material `transparent`, so three keeps all in one
  // list, drawn in draw order, and each writes depth.
  material.transparent = true;
  material.depthWrite = true;
  // three draws a blended two-sided mesh twice, back faces then front, as
  // MathBox's three does: a translucent cone shows its far side. An opaque
  // mark looks the same drawn once.
  material.forceSinglePass = facing === "uniform" || alpha === "opaque";
  /* eslint-enable no-param-reassign */
};

/**
 * Whether `OitFrame` accumulates a material's fragments, to composite them
 * whatever the order: under `oit`, the materials of `translucent` marks.
 * three's `OITPassNode` addon picks the same ones.
 */
export const accumulates = (material: Material): boolean =>
  material.transparent && material.blending === NormalBlending;

/**
 * The materials for one shader, built on first use and shared by every mesh
 * that draws with it. This alone decides three's blending and depth flags.
 */
export const sharedMaterial = (facing: Facing, build: () => Shader) => {
  const materials = new Map<string, MeshBasicNodeMaterial>();
  return (alpha: Alpha, transparency: Transparency): MeshBasicNodeMaterial => {
    const key = `${alpha}/${transparency}`;
    let material = materials.get(key);
    if (!material) {
      const { vertex, color, mask } = build();
      material = new MeshBasicNodeMaterial();
      material.vertexNode = vertex;
      material.colorNode = color;
      if (mask) material.maskNode = mask;
      // Winding says nothing of which way a mark faces: three reverses a
      // mirrored item's front face, and a line's quads follow their segments.
      material.side = DoubleSide;
      if (transparency === "oit") setOitFlags(material, alpha);
      else setOrderedFlags(material, alpha, facing);
      materials.set(key, material);
    }
    return material;
  };
};

/** A mark's material for its opacity, under the scene's transparency model. */
export type MarkMaterial = (
  opacity: Opacity,
  transparency: Transparency,
) => MeshBasicNodeMaterial;

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
