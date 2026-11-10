import { DoubleSide, MeshBasicNodeMaterial, Vector4 } from "three/webgpu";
import type { Node } from "three/webgpu";
import {
  attribute,
  clamp,
  float,
  length,
  max,
  modelViewMatrix,
  userData,
  vec4,
} from "three/tsl";
import type { LineSpec } from "@math3d/viewport-spec";
import { viewUnitsPerPixel } from "../shader/viewUnits";
import type { ARROW_LAYOUT, ArrowEnds, SEGMENT_LAYOUT } from "./packPaths";

/** Without `start`, `end` and `arrowSize`, a stroke has no arrowheads. */
export type StrokeStyle = Pick<
  LineSpec,
  "width" | "color" | "zBias" | "zIndex"
> &
  Partial<Pick<LineSpec, "start" | "end" | "arrowSize">>;

/**
 * One stroke's style as shader inputs. It sits at `userData.stroke` on each
 * of the stroke's meshes, where the shared materials read it per mesh.
 */
export class StrokeUniforms {
  width = 0;

  /** RGBA as the spec gives it: `ThreeScene` outputs colors unconverted. */
  readonly color = new Vector4();

  zBias = 0;

  zIndex = 0;

  arrowSize = 0;

  /** `start` and `end`: 1 where that end of each path has an arrowhead, else 0. */
  start = 0;

  end = 0;

  set(style: StrokeStyle, ends: ArrowEnds): void {
    this.color.set(...style.color);
    this.width = style.width;
    this.zBias = style.zBias;
    this.zIndex = style.zIndex;
    this.arrowSize = style.arrowSize ?? 0;
    this.start = Number(ends.start);
    this.end = Number(ends.end);
  }
}

// three's types give `userData` no node type; this casts to the one asked for.
const read = <T extends "float" | "vec4">(
  property: Exclude<keyof StrokeUniforms, "set">,
  type: T,
) => userData(`stroke.${property}`, type) as unknown as Node<T>;

const width = read("width", "float");
const arrowSize = read("arrowSize", "float");
const hasStart = read("start", "float");
const hasEnd = read("end", "float");

/** The drawn mesh's `StrokeUniforms`, as nodes. */
export const strokeStyle = {
  color: read("color", "vec4"),
  zBias: read("zBias", "float"),
  zIndex: read("zIndex", "float"),
  hasStart,
  hasEnd,
  /** Half the line's width, in view units. */
  halfWidth: width.mul(0.5).mul(viewUnitsPerPixel),
};

/**
 * The length, in view units, of an arrowhead at `tip`, on a path with that
 * view-space middle point and other end. MathBox's sizing: 1.25 × arrowSize
 * × width, shrunk with a cubic ease on a short path.
 */
export const arrowLengthAt = (
  tip: Node<"vec3">,
  middle: Node<"vec3">,
  otherEnd: Node<"vec3">,
): Node<"float"> => {
  const full = max(
    arrowSize.mul(width).mul(1.25).mul(viewUnitsPerPixel),
    1e-12,
  );
  // MathBox's `arrowSpace`: a path with a head at each end counts as half as long.
  const space = float(1.25).div(max(hasStart.add(hasEnd), 1));
  const pathLength = max(length(tip.sub(middle)), length(middle.sub(otherEnd)))
    .mul(2)
    .mul(space);
  const shortfall = clamp(pathLength.div(full).mul(0.333).oneMinus(), 0, 1);
  return full.mul(shortfall.mul(shortfall).mul(shortfall).oneMinus());
};

type PointAttribute = (typeof SEGMENT_LAYOUT | typeof ARROW_LAYOUT)[number][0];

/** A per-instance point, in view space. */
export const toView = (name: PointAttribute) =>
  modelViewMatrix.mul(vec4(attribute<"vec3">(name, "vec3"), 1)).xyz;

type Shader = { vertex: Node<"vec4">; mask?: Node };

/**
 * A stroke material per transparency, built on first use and shared by every
 * stroke: each mesh's `userData.stroke` supplies its style.
 */
export const strokeMaterial = (build: () => Shader) => {
  const materials = new Map<boolean, MeshBasicNodeMaterial>();
  return (transparent: boolean): MeshBasicNodeMaterial => {
    let material = materials.get(transparent);
    if (!material) {
      const { vertex, mask } = build();
      material = new MeshBasicNodeMaterial();
      material.vertexNode = vertex;
      if (mask) material.maskNode = mask;
      material.colorNode = strokeStyle.color;
      material.transparent = transparent;
      // A quad's winding follows its segment's direction on screen. three
      // draws a translucent two-sided mesh twice, back faces then front, as
      // MathBox's three does: a translucent cone shows its far side.
      material.side = DoubleSide;
      materials.set(transparent, material);
    }
    return material;
  };
};
