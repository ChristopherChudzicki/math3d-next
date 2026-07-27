/**
 * The scene behind the default OG card: a fat blue torus with an orange helix
 * winding around its tube, on a faint grid floor with short axes. Built
 * programmatically so the OG generator (`build-og.test.ts`) can load it through
 * the `/app/frame` render page and screenshot it.
 *
 * The exact knobs (radii, camera, helix phase, z-axis length) were locked by
 * visual comparison to the reference art. See the module constants below.
 */
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import type { Scene } from "@math3d/api";

type Vec = [number, number, number];

/** Torus tube center radius (distance from z-axis to the middle of the tube). */
const R = 2.6;
/** Torus tube radius. r < R leaves an open hole. */
const r = 0.9;
/** Number of times the helix winds around the tube. */
const HELIX_LOOPS = 7;
/**
 * Rigid z-rotation of the helix (radians, as LaTeX). Shifting only the toroidal
 * angle t -> t+phase rotates the curve about z; the torus is z-symmetric so only
 * the helix visibly moves. Tuned so the helix crest sits where the art wants it.
 */
const HELIX_PHASE = "+\\frac{\\pi}{16}";
/** Camera distance from the z-axis and its height, chosen for a low, shallow view. */
const CAM_DIST = 9.5;
const CAM_Z = 4.5;
/** Camera azimuth: swung -pi/16 off the +x axis into the +x/-y quadrant. */
const CAM_AZ = -Math.PI / 16;
/** Half-length of the drawn z-axis line, in data units (see `shortenZ`). */
const Z_AXIS_MAX = 2.5;
/** Card-render defaults for the frame sliders — S scales the vectors, T slides
 * the frame along the curve. Both are live sliders in the scene. */
const S_DEFAULT = "1";
const T_DEFAULT = "2.1";
/** TNB vector colors: tangent green, normal red, binormal purple. */
const TNB_COLORS = { T: "#33ff00", N: "#e31a1c", B: "#9b59b6" };

const camera: Vec = [
  CAM_DIST * Math.cos(CAM_AZ),
  CAM_DIST * Math.sin(CAM_AZ),
  CAM_Z,
];

/** A parseable LaTeX function-assignment, mirroring the item-config defaults. */
const fn = (params: string[], rhs: string) => ({
  type: "function-assignment" as const,
  name: "_f",
  params,
  rhs,
});

const interval = "\\left[-\\pi,\\pi\\right]";
const torusDomain = {
  type: "array" as const,
  items: [fn(["v"], interval), fn(["u"], interval)],
};
const helixDomain = {
  type: "array" as const,
  items: [{ type: "expr" as const, expr: interval }],
};

/** Torus (major R, minor r) as a mathbox LaTeX parametric vector. */
const torus = `\\left[\\left(${R}+${r}\\cos(v)\\right)\\cos(u),\\ \\left(${R}+${r}\\cos(v)\\right)\\sin(u),\\ ${r}\\sin(v)\\right]`;
/** Helix lying ON the tube (radius r), rotated about z by HELIX_PHASE. */
const helix = `\\left[\\left(${R}+${r}\\cos(${HELIX_LOOPS}t)\\right)\\cos(t${HELIX_PHASE}),\\ \\left(${R}+${r}\\cos(${HELIX_LOOPS}t)\\right)\\sin(t${HELIX_PHASE}),\\ ${r}\\sin(${HELIX_LOOPS}t)\\right]`;

// The scene JSON is untyped per-item; these helpers reach into item properties.
/* eslint-disable @typescript-eslint/no-explicit-any */
const props = (it: unknown) => (it as any).properties;
const axes = (json: Scene) =>
  json.items.filter((it) => it.type === MathItemType.Axis);
const grids = (json: Scene) =>
  json.items.filter((it) => it.type === MathItemType.Grid);
const zAxis = (json: Scene) => {
  const z = axes(json).find((it) => props(it).axis === "z");
  if (!z) throw new Error("no z-axis item");
  return z;
};

/** Override the seeded camera for deterministic framing. */
const setCamera = (json: Scene): Scene => {
  const cam = json.items.find((it) => it.type === MathItemType.Camera);
  if (!cam) throw new Error("no camera item");
  props(cam).position = `[${camera.join(", ")}]`;
  props(cam).target = "[0, 0, 0]";
  return json;
};

/** Strip axis letter-labels and number ticks — the main card clutter. */
const cleanAxes = (json: Scene): Scene => {
  axes(json).forEach((it) => {
    props(it).labelVisible = "false";
    props(it).ticksVisible = "false";
  });
  return json;
};

/** Thicken all axes / grids (defaults read thin and pixelated). */
const setAxisWidth = (json: Scene, w: string): Scene => {
  axes(json).forEach((it) => {
    props(it).width = w;
  });
  return json;
};
const setGridWidth = (json: Scene, w: string): Scene => {
  grids(json).forEach((it) => {
    props(it).width = w;
  });
  return json;
};

/**
 * Shorten the z-AXIS LINE to +/-max (data coords) WITHOUT stretching geometry.
 * Geometry maps world_z = scale_z * v / halfwidth_z; x/y use scale 1, halfwidth
 * 5 (one data-unit = 1/5 world). To keep z isometric while halfwidth_z shrinks
 * to `max`, scale_z must = max/5. The axis line (drawn to data +/-max) then
 * reaches world +/-(max/5) — shorter — but the torus is unchanged. (The default
 * scene ships z scale "1/2", which instead squashes z to half.)
 */
const shortenZ = (json: Scene, max: number): Scene => {
  const p = props(zAxis(json));
  p.min = `${-max}`;
  p.max = `${max}`;
  p.scale = `${max}/5`;
  return json;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Build the locked torus-hero scene for the default OG card. */
export const buildTorusScene = (): Scene => {
  const s = new SceneBuilder();
  const f = s.folder({ description: "Torus + helix" });
  f.parametricSurface({
    expr: fn(["u", "v"], torus),
    domain: torusDomain,
    color: "#3090FF",
    opacity: "1",
    samples1: "128",
    samples2: "128",
  });
  f.parametricCurve({
    expr: fn(["t"], helix),
    domain: helixDomain,
    color: "#ff7a00",
    width: "12",
    samples1: "512",
    zBias: "5",
  });
  // Name the helix `f(t)` so the TNB (Frenet frame) vectors below can reference
  // it via unitT/unitN/unitB — the same helpers users get from the calculus
  // keyboard. Each vector's tail sits on the curve at t = T (the slider).
  f.variable({
    value: { type: "assignment", lhs: "f\\left(t\\right)", rhs: helix },
  });
  // Sliders drive the frame: T slides it along the curve, S scales the vectors.
  f.variableSlider({
    value: { type: "assignment", lhs: "S", rhs: S_DEFAULT },
    range: { type: "array", items: ["0", "1.5"] },
  });
  f.variableSlider({
    value: { type: "assignment", lhs: "T", rhs: T_DEFAULT },
    range: { type: "array", items: ["-\\pi", "\\pi"] },
  });
  const tail = "f\\left(T\\right)";
  const frame = (op: string) =>
    `S\\cdot\\operatorname{${op}}\\left(f,T\\right)`;
  // zBias so the vectors (esp. the tangent, which runs along the tube) render
  // on top of the surface instead of being occluded by it. The normal uses -N
  // so it points to the outside of the curve rather than into the tube.
  const vec = { width: "6", zBias: "6", tail };
  f.vector({ ...vec, color: TNB_COLORS.T, components: frame("unitT") });
  f.vector({ ...vec, color: TNB_COLORS.N, components: `-${frame("unitN")}` });
  f.vector({ ...vec, color: TNB_COLORS.B, components: frame("unitB") });
  const json = s.json();
  setCamera(json);
  cleanAxes(json);
  setAxisWidth(json, "4");
  setGridWidth(json, "2");
  shortenZ(json, Z_AXIS_MAX);
  return json;
};
