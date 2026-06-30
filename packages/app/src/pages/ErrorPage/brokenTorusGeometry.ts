/**
 * Geometry for the decorative "broken torus" wireframe.
 *
 * A real parametric torus, projected to 2D, with an angular wedge removed and a
 * couple of tube-ring fragments drifting out of the gap — so it reads as a
 * cracked/broken donut. Pure and deterministic (no randomness), so the rendered
 * SVG is stable across runs and snapshot-friendly.
 *
 *   x = (R + r·cos v)·cos u,  y = (R + r·cos v)·sin u,  z = r·sin v
 *
 * u = major angle (around the hole), v = minor angle (around the tube).
 */

/** Which palette slot a stroke should use; mapped to a colour by the component. */
export type StrokeRole = "main" | "accent" | "cut";

export interface TorusPath {
  d: string;
  opacity: number;
  width: number;
  role: StrokeRole;
  dash?: string;
}

export interface BrokenTorusOptions {
  /** major radius */
  R: number;
  /** tube radius */
  r: number;
  /** viewing tilt, degrees */
  tilt: number;
  /** projection centre */
  cx: number;
  cy: number;
  /** removed angular wedge [start, end] in radians of the major angle u */
  gap: [number, number];
  /** number of tube cross-section rings around the full torus */
  rings: number;
}

const TAU = Math.PI * 2;

export const DEFAULT_OPTIONS: BrokenTorusOptions = {
  R: 108,
  r: 40,
  tilt: 64,
  cx: 200,
  cy: 132,
  gap: [Math.PI * 1.05, Math.PI * 1.46],
  rings: 44,
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

type Point = { x: number; y: number; z: number };
type Projected = { X: number; Y: number; depth: number };

const makeProjector = (tiltDeg: number, cx: number, cy: number) => {
  const a = (tiltDeg * Math.PI) / 180;
  const ca = Math.cos(a);
  const sa = Math.sin(a);
  return ({ x, y, z }: Point): Projected => {
    // rotate about the X axis by `a`, then orthographic project
    const y2 = y * ca - z * sa;
    const z2 = y * sa + z * ca;
    return { X: cx + x, Y: cy - y2, depth: z2 };
  };
};

const loopPath = (
  fn: (t: number) => Point,
  project: (p: Point) => Projected,
  [t0, t1]: [number, number],
  samples: number,
): { d: string; depth: number } => {
  let d = "";
  let depthSum = 0;
  for (let i = 0; i <= samples; i += 1) {
    const t = t0 + ((t1 - t0) * i) / samples;
    const s = project(fn(t));
    d += `${i === 0 ? "M" : "L"}${s.X.toFixed(1)} ${s.Y.toFixed(1)}`;
    depthSum += s.depth;
  }
  return { d, depth: depthSum / (samples + 1) };
};

/** Build the list of stroked paths that make up the broken torus. */
const brokenTorusPaths = (
  options: Partial<BrokenTorusOptions> = {},
): TorusPath[] => {
  const o = { ...DEFAULT_OPTIONS, ...options };
  const project = makeProjector(o.tilt, o.cx, o.cy);
  const maxDepth =
    (o.R + o.r) * Math.abs(Math.sin((o.tilt * Math.PI) / 180)) * 0.55 + o.r;

  const tubeCircle =
    (u: number) =>
    (v: number): Point => ({
      x: (o.R + o.r * Math.cos(v)) * Math.cos(u),
      y: (o.R + o.r * Math.cos(v)) * Math.sin(u),
      z: o.r * Math.sin(v),
    });
  const latitudeRing =
    (v: number) =>
    (u: number): Point =>
      tubeCircle(u)(v);

  const inGap = (u: number) => {
    const uu = ((u % TAU) + TAU) % TAU;
    return uu > o.gap[0] && uu < o.gap[1];
  };

  const paths: TorusPath[] = [];

  // tube cross-section rings, skipping the wedge; back rings fade
  for (let i = 0; i < o.rings; i += 1) {
    const u = (TAU * i) / o.rings;
    if (!inGap(u)) {
      const { d, depth } = loopPath(tubeCircle(u), project, [0, TAU], 40);
      const opacity = 0.32 + 0.6 * clamp01((depth + maxDepth) / (2 * maxDepth));
      paths.push({ d, opacity, width: 1.4, role: "main" });
    }
  }

  // a few latitude rings for form, split into faded back / brighter front halves
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((v) => {
    const samples = 240;
    let front = "";
    let back = "";
    let prevFront: boolean | null = null;
    for (let i = 0; i <= samples; i += 1) {
      const u = (TAU * i) / samples;
      if (inGap(u)) {
        prevFront = null;
      } else {
        const s = project(latitudeRing(v)(u));
        const isFront = s.depth >= 0;
        const cmd = prevFront === isFront ? "L" : "M";
        const seg = `${cmd}${s.X.toFixed(1)} ${s.Y.toFixed(1)}`;
        if (isFront) front += seg;
        else back += seg;
        prevFront = isFront;
      }
    }
    if (back) paths.push({ d: back, opacity: 0.22, width: 1.2, role: "main" });
    if (front) paths.push({ d: front, opacity: 0.7, width: 1.2, role: "main" });
  });

  // trailing cut face: emphasized solid ring (the clean break)
  paths.push({
    ...loopPath(tubeCircle(o.gap[1]), project, [0, TAU], 48),
    opacity: 0.95,
    width: 2.4,
    role: "cut",
  });
  // leading cut face: dashed "ghost" ring marking the missing wedge
  paths.push({
    ...loopPath(tubeCircle(o.gap[0]), project, [0, TAU], 48),
    opacity: 0.7,
    width: 1.8,
    role: "cut",
    dash: "5 5",
  });

  // a couple of tube-ring fragments flung out of the gap
  const gapMid = (o.gap[0] + o.gap[1]) / 2;
  [
    { du: 0.08, push: 30, drop: 20, opacity: 0.9, width: 2.0 },
    { du: -0.04, push: 64, drop: 52, opacity: 0.55, width: 1.7 },
  ].forEach((f) => {
    const u = gapMid + f.du;
    const base = tubeCircle(u);
    const dir = { x: Math.cos(u), y: Math.sin(u) };
    const fn = (v: number): Point => {
      const p = base(v);
      return {
        x: p.x + dir.x * f.push,
        y: p.y + dir.y * f.push,
        z: p.z + f.drop,
      };
    };
    paths.push({
      ...loopPath(fn, project, [0, TAU], 36),
      opacity: f.opacity,
      width: f.width,
      role: "accent",
    });
  });

  return paths;
};

export default brokenTorusPaths;
