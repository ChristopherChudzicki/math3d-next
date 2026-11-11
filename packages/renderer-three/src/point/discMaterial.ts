/**
 * The point disc: a square around each point, sized in view space and cut
 * to a circle in the fragment shader, after MathBox's `point.position`,
 * `point.mask.circle` and `point.alpha.circle` shaders.
 */
import { Vector4 } from "three/webgpu";
import {
  attribute,
  cameraProjectionMatrix,
  dot,
  modelViewMatrix,
  positionGeometry,
  screenSize,
  varying,
  vec3,
  vec4,
} from "three/tsl";
import type { PointSpec } from "@math3d/viewport-spec";
import { projectWithDepthStyle } from "../shader/depthStyle";
import { sharedMaterial, uniformsAt } from "../shader/material";
import type { MarkMaterial } from "../shader/material";
import { viewUnitsPerPixel } from "../shader/viewUnits";
import type { Layout, Template } from "../instances/Instances";

/** Per point: its center. */
export const DISC_LAYOUT = [["discCenter", 3]] as const satisfies Layout;

/** A square with corners at ±1, wound counterclockwise. */
export const SQUARE_TEMPLATE: Template = {
  positions: [-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0],
  index: [0, 1, 2, 2, 1, 3],
};

export type DiscStyle = Pick<PointSpec, "color" | "zBias" | "zIndex"> & {
  /** In CSS pixels at view depth 1. */
  diameter: number;
};

/**
 * One set of discs' style as shader inputs, at `userData.disc` on each of
 * its meshes, where the shared materials read it per mesh.
 */
export class DiscUniforms {
  diameter = 0;

  /** RGBA as the spec gives it: `ThreeScene` outputs colors unconverted. */
  readonly color = new Vector4();

  zBias = 0;

  zIndex = 0;

  set(style: DiscStyle): void {
    this.diameter = style.diameter;
    this.color.set(...style.color);
    this.zBias = style.zBias;
    this.zIndex = style.zIndex;
  }
}

const read = uniformsAt<DiscUniforms>("disc");

/** Fill: where the disc is opaque. Edge: its antialiased rim. */
type DiscPart = "fill" | "edge";

const build = (part: DiscPart) => {
  const color = read("color", "vec4");
  const center = modelViewMatrix.mul(
    vec4(attribute<"vec3">("discCenter", "vec3"), 1),
  ).xyz;
  // Fixed in view space, like a stroke's width: MathBox's point `depth` is 1.
  const radius = read("diameter", "float").mul(0.5).mul(viewUnitsPerPixel);
  const clip = cameraProjectionMatrix.mul(vec4(center, 1));
  // At the point's depth, in either projection.
  const viewUnitsPerDevicePixel = clip.w
    .mul(2)
    .div(cameraProjectionMatrix.mul(vec4(0, 1, 0, 0)).y.mul(screenSize.y));
  // MathBox's `pixelSize`, half the on-screen radius, and its square padded
  // by one device pixel so the antialiased rim straddles the circle's edge.
  const pixelSize = radius.div(viewUnitsPerDevicePixel).mul(0.5);
  const halfSide = radius.add(viewUnitsPerDevicePixel);
  const corner = center.add(vec3(positionGeometry.xy.mul(halfSide), 0));
  const vertex = projectWithDepthStyle(
    corner,
    read("zBias", "float"),
    read("zIndex", "float"),
  );

  // Squared distance from the center, 1 at the padded square's inscribed circle.
  const sprite = varying(positionGeometry.xy);
  const mask = dot(sprite, sprite);
  const alpha = varying(pixelSize.add(0.5)).mul(mask.oneMinus());
  const inside = mask.lessThanEqual(1);
  return part === "fill"
    ? { vertex, color, mask: inside.and(alpha.greaterThanEqual(1)) }
    : {
        vertex,
        color: vec4(color.rgb, alpha.mul(color.a)),
        mask: inside.and(alpha.lessThan(1)),
      };
};

/** The material for the fill of discs of that opacity. */
export const fillMaterial: MarkMaterial = sharedMaterial("uniform", () =>
  build("fill"),
);

const edge = sharedMaterial("uniform", () => build("edge"));

/**
 * The material for the rim of discs of that opacity. An opaque disc's rim
 * only antialiases it; a translucent disc's is as translucent as its fill.
 */
export const edgeMaterial: MarkMaterial = (opacity, transparency) =>
  edge(opacity === "opaque" ? "edges" : opacity, transparency);
