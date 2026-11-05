import type { Coords } from "@/features/viewport/shared/coordinates";
import type { CameraSpec } from "./graphicSpec/types";

/** Use.GPU `OrbitControls` parameters (world coordinates, y up). */
export type OrbitSpec = {
  radius: number;
  bearing: number;
  pitch: number;
  target: Coords;
};

/**
 * Use.GPU's orbit camera is y-up; math3d is z-up. live/scene.ts rotates the
 * plot by this much, taking math (x, y, z) to world (x, z, -y): `toWorld`.
 */
export const PLOT_ROTATION_DEGREES = [-90, 0, 0];

/** Where the plot rotation takes a math3d point. The camera spec is in math3d coordinates. */
export const toWorld = ([x, y, z]: Coords): Coords => [x, z, -y];

/**
 * Orbit parameters that put the camera at `position` looking at `target`:
 * the inverse of `makeOrbitMatrix` in @use-gpu/core, whose camera sits at
 * target + (-r·cos(pitch)·sin(bearing), r·sin(pitch), r·cos(pitch)·cos(bearing)).
 */
export const toOrbit = (camera: CameraSpec): OrbitSpec => {
  const p = toWorld(camera.position);
  const t = toWorld(camera.target);
  const d = [p[0] - t[0], p[1] - t[1], p[2] - t[2]];
  const radius = Math.hypot(...d) || 1;
  return {
    radius,
    pitch: Math.asin(Math.max(-1, Math.min(1, d[1] / radius))),
    bearing: Math.atan2(-d[0], d[2]),
    target: t,
  };
};

/** Where `makeOrbitPosition` (dolly 1) puts the camera, as a world-space offset from the target. */
const orbitOffset = ({ radius, bearing, pitch }: OrbitSpec): Coords => [
  -radius * Math.cos(pitch) * Math.sin(bearing),
  radius * Math.sin(pitch),
  radius * Math.cos(pitch) * Math.cos(bearing),
];

const fromWorld = ([x, y, z]: Coords): Coords => [x, -z, y];

/** The inverse of `toOrbit`. */
export const fromOrbit = (orbit: OrbitSpec): CameraSpec => {
  const d = orbitOffset(orbit);
  const t = orbit.target;
  return {
    position: fromWorld([t[0] + d[0], t[1] + d[1], t[2] + d[2]]),
    target: fromWorld(t),
  };
};

const cross = (a: Coords, b: Coords): Coords => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

const normalize = (v: Coords): Coords => {
  const n = Math.hypot(...v);
  return [v[0] / n, v[1] / n, v[2] / n];
};

/**
 * The world-space key light position for a camera orbit: MathBox's light,
 * fixed at (1, 2, 2) in view space (right, up, towards the viewer).
 */
export const keyLightPosition = (orbit: OrbitSpec): Coords => {
  const z = normalize(orbitOffset({ ...orbit, radius: 1 }));
  const side = cross([0, 1, 0], z);
  const x: Coords = Math.hypot(...side) < 1e-6 ? [1, 0, 0] : normalize(side);
  const y = cross(z, x);
  return [0, 1, 2].map((i) => x[i] + 2 * y[i] + 2 * z[i]) as Coords;
};
