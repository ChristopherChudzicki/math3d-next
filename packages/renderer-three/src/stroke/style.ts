import { Vector4 } from "three/webgpu";
import type { Node } from "three/webgpu";
import {
  attribute,
  clamp,
  float,
  length,
  max,
  modelViewMatrix,
  vec4,
} from "three/tsl";
import type { LineSpec } from "@math3d/viewport-spec";
import { sharedMaterial, uniformsAt } from "../shader/material";
import type { MarkMaterial, Shader } from "../shader/material";
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

const read = uniformsAt<StrokeUniforms>("stroke");

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

/** An arrowhead cone's length over its base radius, as MathBox draws it. */
export const LENGTH_TO_RADIUS = 2.5;

/**
 * The length, in view units, of an arrowhead at `tip`, on a path with that
 * view-space middle point and other end: a cone `arrowSize` line widths
 * across its base, shrunk with a cubic ease on a short path, as MathBox's.
 */
export const arrowLengthAt = (
  tip: Node<"vec3">,
  middle: Node<"vec3">,
  otherEnd: Node<"vec3">,
): Node<"float"> => {
  const full = max(
    arrowSize.mul(width).mul(0.5).mul(LENGTH_TO_RADIUS).mul(viewUnitsPerPixel),
    1e-12,
  );
  // MathBox's short-path rule (`arrowSpace`): a path with a head at each end
  // counts as half as long.
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

type Shape = Omit<Shader, "color">;

/**
 * The materials for one part of a stroke, in the stroke's color. Each mesh's
 * `userData.stroke` supplies its style.
 */
export const strokeMaterial = (build: () => Shape): MarkMaterial =>
  sharedMaterial("mixed", () => ({ ...build(), color: strokeStyle.color }));
