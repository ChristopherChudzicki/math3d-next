/**
 * Tick marks: one segment per tick, centered on it, a fixed pixel length
 * along its direction as the view sees it; MathBox's `ticks.position`.
 */
import { attribute, modelViewMatrix, normalize, vec4 } from "three/tsl";
import { viewUnitsPerPixel } from "../shader/viewUnits";
import type { Layout } from "../instances/Instances";
import { lineVertex } from "./lineMaterial";
import { strokeMaterial } from "./style";

/** Per tick: where it is, and the direction it runs, in math coordinates. */
export const TICK_LAYOUT = [
  ["tickCenter", 3],
  ["tickDirection", 3],
] as const satisfies Layout;

/** MathBox's tick length, in CSS pixels. */
const TICK_SIZE = 10;

/** MathBox's tick width, in CSS pixels. */
export const TICK_WIDTH = 2;

const build = () => {
  const center = modelViewMatrix.mul(
    vec4(attribute<"vec3">("tickCenter", "vec3"), 1),
  ).xyz;
  // Normalized after the axes' scale, so that scale leaves the length alone.
  const along = normalize(
    modelViewMatrix.mul(vec4(attribute<"vec3">("tickDirection", "vec3"), 0))
      .xyz,
  );
  const half = along.mul(viewUnitsPerPixel.mul(TICK_SIZE / 2));
  const a = center.sub(half);
  const b = center.add(half);
  return lineVertex(false, { before: a, a, b, after: b });
};

/** The tick material for ticks of that alpha, shared by all. */
export const tickMaterial = strokeMaterial(build);
