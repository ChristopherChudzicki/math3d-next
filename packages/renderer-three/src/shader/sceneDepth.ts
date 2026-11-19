/**
 * Whether the scene covers a point: the test that draws a mark whole or not
 * at all, by its anchor, where a per-fragment depth test would cut it.
 */
import { DepthTexture, WebGLCoordinateSystem } from "three/webgpu";
import type { Node } from "three/webgpu";
import {
  Fn,
  cameraProjectionMatrix,
  clamp,
  ivec2,
  screenDPR,
  screenSize,
  texture,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { projectWithDepthStyle } from "./depthStyle";

/** The layer `OitFrame` draws over the finished scene, in its canvas draw. */
export const OVERLAY_LAYER = 1;

/**
 * The depth the scene's marks wrote. `OitFrame` points it at its own target
 * before each overlay draw, so every viewport reads its own.
 */
export const sceneDepth = texture(new DepthTexture(1, 1));

/**
 * View units an anchor may lie behind what covers it and still show: an
 * anchor in a surface, or on its own axis line, ties with it in depth.
 */
const TOLERANCE = 0.005;

/** CSS pixels from the anchor to each of the four taps around it. */
const TAP_RADIUS = 3;

// The anchor's pixel and four around it: a thin line over the anchor covers
// some of them, not all.
const TAPS = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** The depth a buffer stores for an NDC z: WebGL's z runs from -1. */
const toStoredDepth = (ndcZ: Node<"float">): Node<"float"> =>
  // three types the call's result conditionally on the callback's, which
  // TypeScript can't resolve here.
  Fn((builder) =>
    builder.renderer.coordinateSystem === WebGLCoordinateSystem
      ? ndcZ.mul(0.5).add(0.5)
      : ndcZ,
  )() as Node<"float">;

/**
 * Projects a view-space anchor for a mark of the overlay layer.
 *
 * `shows` is whether the scene leaves the anchor uncovered: at one of the
 * taps, nothing is nearer than the anchor by more than the tolerance plus
 * `clearance`, in view units. `zBias` and `zIndex` are those of the mark at
 * the anchor, so the two tie.
 */
export const projectAnchor = (
  view: Node<"vec3">,
  zBias: Node<"float">,
  zIndex: Node<"float">,
  clearance: Node<"float">,
): { clip: Node<"vec4">; shows: Node<"bool"> } => {
  const clip = cameraProjectionMatrix.mul(vec4(view, 1));
  const nearer = projectWithDepthStyle(
    vec3(view.xy, view.z.add(clearance).add(TOLERANCE)),
    zBias,
    zIndex,
  );
  const ndcZ = nearer.z.div(nearer.w);
  const depth = toStoredDepth(ndcZ);
  const ndc = clip.xy.div(clip.w);
  // In device pixels; texel rows run down the screen.
  const pixel = vec2(ndc.x.mul(0.5).add(0.5), ndc.y.mul(-0.5).add(0.5)).mul(
    screenSize,
  );
  const shows = TAPS.map(([x, y]) => {
    const tap = clamp(
      pixel.add(vec2(x, y).mul(screenDPR.mul(TAP_RADIUS))),
      vec2(0, 0),
      screenSize.sub(1),
    );
    return depth.lessThanEqual(sceneDepth.load(ivec2(tap)).x);
  }).reduce((any, tap) => any.or(tap));
  return { clip: vec4(clip.xy, ndcZ.mul(clip.w), clip.w), shows };
};
