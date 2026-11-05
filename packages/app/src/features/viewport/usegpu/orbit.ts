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
