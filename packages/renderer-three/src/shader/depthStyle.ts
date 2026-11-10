import {
  cameraNear,
  cameraProjectionMatrix,
  float,
  max,
  mix,
  vec4,
} from "three/tsl";
import type { Node } from "three/webgpu";

// MathBox's camera planes (threestrap's defaults), which calibrate its zBias.
const MATHBOX_NEAR = 0.01;
const MATHBOX_FAR = 10000;
const BIAS_RATE =
  (MATHBOX_FAR + MATHBOX_NEAR) / (2 * MATHBOX_FAR * MATHBOX_NEAR);

/** NDC z of a point `depth` in front of the camera. */
const ndcZ = (depth: Node<"float">) => {
  const clip = cameraProjectionMatrix.mul(vec4(0, 0, depth.negate(), 1));
  return clip.z.div(clip.w);
};

/**
 * Projects a view-space position with MathBox's `zBias` and `zIndex`.
 *
 * - `zBias` moves depth as MathBox's `z *= 1 - zBias / 32768` does under its
 *   perspective camera, restated as a change in view depth so that it is the
 *   same on both backends and in both projections.
 *   A negative one reaches this camera's far plane, a tenth of MathBox's,
 *   sooner: `zBias` -1 is clipped beyond depth 396, MathBox's beyond 615.
 * - `zIndex`, rounded and never negative as in MathBox, divides NDC depth
 *   past the near plane by `zIndex + 1`: a higher one draws over a lower one
 *   unless that one is almost at the camera.
 */
export const projectWithDepthStyle = (
  view: Node<"vec3">,
  zBias: Node<"float">,
  zIndex: Node<"float">,
): Node<"vec4"> => {
  const clip = cameraProjectionMatrix.mul(vec4(view, 1));
  const depth = view.z.negate();
  // An orthographic view also draws what is behind the camera, where the
  // perspective formula has no meaning: the bias there is the near plane's.
  const from = max(depth, MATHBOX_NEAR);
  // 1/d' = (1 - e)/d + e (f + n)/(2 f n), with e = zBias / 32768.
  const epsilon = zBias.div(32768);
  const to = from.div(
    max(epsilon.oneMinus().add(epsilon.mul(BIAS_RATE).mul(from)), 1e-6),
  );
  const biased = ndcZ(depth.sub(from.sub(to)));
  const layer = max(zIndex.round(), 0);
  const z = mix(ndcZ(cameraNear), biased, float(1).div(layer.add(1)));
  return vec4(clip.xy, z.mul(clip.w), clip.w);
};
