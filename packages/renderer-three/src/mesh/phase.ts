import type { Node } from "three/webgpu";
import { atan, dot, fract, select } from "three/tsl";

/**
 * A wrapping value's phase: its point on the unit circle, where blending two
 * points takes the short way around. A value that isn't finite is the
 * circle's center, which leaves a blend to the other points.
 */
export const writePhase = (
  out: Float32Array,
  vertex: number,
  value: number,
): void => {
  const finite = Number.isFinite(value);
  // In [0, 1) up to rounding: a hair below 0 is 0, not 1.
  const angle = 2 * Math.PI * Math.max(value, 0);
  /* eslint-disable no-param-reassign */
  out[2 * vertex] = finite ? Math.cos(angle) : 0;
  out[2 * vertex + 1] = finite ? Math.sin(angle) : 0;
  /* eslint-enable no-param-reassign */
};

/**
 * The value in [0, 1) at a blend of phases: its angle, as a fraction of a
 * turn. At the circle's center there is no angle, and the value is 0.
 */
export const phaseValue = (phase: Node<"vec2">): Node<"float"> =>
  select(
    dot(phase, phase).lessThan(1e-12),
    0,
    fract(atan(phase.y, phase.x).div(2 * Math.PI)),
  );
