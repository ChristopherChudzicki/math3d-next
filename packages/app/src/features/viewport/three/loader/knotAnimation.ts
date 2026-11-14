/**
 * The loading knot: a trefoil, tumbling about a drifting axis, whose arc grows
 * with load progress along a dashed outline of the knot; when the load
 * finishes, the outline thickens into the arc to close it. It needs only a 2D
 * canvas context, so a Web Worker can draw it.
 */

import { createKnotProgress } from "./knotProgress";
import type { KnotProgress, LoadStage } from "./knotProgress";

export type Rgb = readonly [number, number, number];

export type KnotOptions = {
  /** CSS pixels. */
  width: number;
  height: number;
  background: Rgb;
  ink: Rgb;
  /** Hold the knot still and grow the arc in place, for reduced motion. */
  still: boolean;
};

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Vec = readonly [number, number, number];
type Mat = readonly number[];
/** Screen x, screen y, depth (toward the viewer), perspective scale. */
type Projected = readonly [number, number, number, number];
/** Something to paint, at a depth; painted back to front. */
type Item = { z: number; draw: () => void };

const TAU = 2 * Math.PI;
const SAMPLES = 200;
/** In units of the knot's radius. */
const STROKE_WIDTH = 0.13;
/** Camera distance in knot radii; sets the strength of the perspective. */
const CAMERA = 3.5;
const SHADES = 64;
/** Laps of the knot per second the arc's tail travels. */
const TAIL_SPEED = 0.2;
/** Scales the tumble's angular speed, in radians per second. */
const TUMBLE_SPEED = 1.2;
/** Fraction of the knot the arc covers at zero progress. */
const MIN_ARC = 0.08;
/** Samples per dash, and per gap, of the track the arc travels along. */
const DASH = 3;
/** In CSS pixels, unlike `STROKE_WIDTH`. */
const TRACK_WIDTH = 1.5;

const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a: Vec, s: number): Vec => [a[0] * s, a[1] * s, a[2] * s];
const unit = (a: Vec): Vec => scale(a, 1 / (Math.hypot(...a) || 1));

const trefoil = (t: number): Vec => [
  Math.sin(t) + 2 * Math.sin(2 * t),
  Math.cos(t) - 2 * Math.cos(2 * t),
  -1.4 * Math.sin(3 * t),
];

/**
 * `count` points around the closed curve `f`, evenly spaced by arc length, so
 * an arc advancing a fixed number of samples per second moves at a steady
 * speed. The trefoil's own parameter runs 1.6 times faster in some places than
 * others.
 */
export const evenlySpaced = (f: (t: number) => Vec, count: number): Vec[] => {
  const fineCount = count * 20;
  const fine = Array.from({ length: fineCount }, (_, i) =>
    f((i / fineCount) * TAU),
  );
  const lengths = [0];
  fine.forEach((p, i) => {
    lengths.push(lengths[i] + Math.hypot(...sub(fine[(i + 1) % fineCount], p)));
  });
  const total = lengths[fineCount];
  let j = 0;
  return Array.from({ length: count }, (_, k) => {
    const target = (k / count) * total;
    while (lengths[j + 1] < target) j += 1;
    const s = (target - lengths[j]) / (lengths[j + 1] - lengths[j]);
    const a = fine[j];
    return add(a, scale(sub(fine[(j + 1) % fineCount], a), s));
  });
};

const KNOT = (() => {
  const raw = evenlySpaced(trefoil, SAMPLES);
  const radius = Math.max(...raw.map((p) => Math.hypot(...p)));
  return raw.map((p) => scale(p, 1 / radius));
})();

type Quat = readonly [number, number, number, number];
const qmul = (a: Quat, b: Quat): Quat => [
  a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
  a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
  a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
  a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
];
const toMatrix = ([w, x, y, z]: Quat): Mat => [
  1 - 2 * (y * y + z * z),
  2 * (x * y - w * z),
  2 * (x * z + w * y),
  2 * (x * y + w * z),
  1 - 2 * (x * x + z * z),
  2 * (y * z - w * x),
  2 * (x * z - w * y),
  2 * (y * z + w * x),
  1 - 2 * (x * x + y * y),
];
const apply = (m: Mat, p: Vec): Vec => [
  m[0] * p[0] + m[1] * p[1] + m[2] * p[2],
  m[3] * p[0] + m[4] * p[1] + m[5] * p[2],
  m[6] * p[0] + m[7] * p[1] + m[8] * p[2],
];

/**
 * A rotation about an axis that drifts with three sine waves of unrelated
 * periods, so the motion never visibly repeats. Starts at full speed from a
 * random orientation: a load is often over within a second. Held still, the
 * knot faces the viewer down its axis of threefold symmetry instead.
 */
const makeTumble = (still: boolean) => {
  const axis = unit([
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  ]);
  const phases = [0, 1, 2].map(() => Math.random() * TAU);
  const rates = [0.37, 0.29, 0.19];
  const start = still
    ? [1, 0, 0, 0]
    : [0, 1, 2, 3].map(() => Math.random() * 2 - 1);
  const length = Math.hypot(...start) || 1;
  let q: Quat = [
    start[0] / length,
    start[1] / length,
    start[2] / length,
    start[3] / length,
  ];
  return (dt: number, elapsed: number): Mat => {
    const w = [0, 1, 2].map(
      (i) =>
        (axis[i] * 0.55 + 0.4 * Math.sin(rates[i] * elapsed + phases[i])) *
        TUMBLE_SPEED,
    );
    const speed = Math.hypot(w[0], w[1], w[2]);
    if (speed > 1e-6) {
      const half = (speed * dt) / 2;
      const s = Math.sin(half) / speed;
      q = qmul([Math.cos(half), w[0] * s, w[1] * s, w[2] * s], q);
      const n = Math.hypot(...q);
      q = [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
    }
    return toMatrix(q);
  };
};

const makePalette = (background: Rgb, ink: Rgb) =>
  Array.from({ length: SHADES + 1 }, (_, k) => {
    const t = k / SHADES;
    const [r, g, b] = background.map((c, i) =>
      Math.round(c + (ink[i] - c) * t),
    );
    return `rgb(${r},${g},${b})`;
  });

/** Palette positions, by depth, for the dashed track and for the arc. */
const trackShade = (z: number) => 0.28 + 0.12 * (z + 1);
const arcShade = (z: number) => 0.3 + 0.26 * (z + 1);

const lerpProjected = (a: Projected, b: Projected, s: number): Projected => [
  a[0] + (b[0] - a[0]) * s,
  a[1] + (b[1] - a[1]) * s,
  a[2] + (b[2] - a[2]) * s,
  a[3] + (b[3] - a[3]) * s,
];

/** The value at fractional sample index `u` around the closed knot. */
const lerpAt = <T, R>(
  samples: readonly T[],
  u: number,
  lerp: (a: T, b: T, s: number) => R,
): R => {
  const i = Math.floor(u);
  return lerp(samples[i % SAMPLES], samples[(i + 1) % SAMPLES], u - i);
};

export type KnotAnimation = {
  setStage: (stage: LoadStage) => void;
  /** Advances by `dt` seconds and draws. */
  draw: (dt: number) => void;
};

export const createKnotAnimation = (
  context: Ctx,
  { width, height, background, ink, still }: KnotOptions,
): KnotAnimation => {
  const ctx = context;
  const palette = makePalette(background, ink);
  const radius = Math.min(width, height) * 0.34;
  const tumble = makeTumble(still);
  const progress = createKnotProgress();
  let elapsed = 0;
  let tail = 0;
  /** What the last frame drew, so a still knot can skip unchanged frames. */
  let drawn: KnotProgress = { shown: -1, finish: -1 };

  const project = (m: Mat, p: Vec): Projected => {
    const [x, y, z] = apply(m, p);
    const f = CAMERA / (CAMERA - z);
    return [width / 2 + x * radius * f, height / 2 - y * radius * f, z, f];
  };

  /**
   * Fractional sample indices from `from` to `to`: the two ends and every
   * whole sample between, so an arc's ends glide rather than step from sample
   * to sample.
   */
  const stations = (from: number, to: number) => {
    const result = [from];
    for (let i = Math.floor(from) + 1; i < to; i += 1) result.push(i);
    result.push(to);
    return result;
  };

  /** Dashes along the whole knot, except where the arc covers it. */
  const track = (points: Projected[], start: number, span: number): Item[] => {
    const items: Item[] = [];
    for (let k = 0; k < SAMPLES; k += 1) {
      const covered = (k + 0.5 - start + SAMPLES) % SAMPLES < span;
      if (!covered && Math.floor(k / DASH) % 2 === 0) {
        const a = points[k];
        const b = points[(k + 1) % SAMPLES];
        const z = (a[2] + b[2]) / 2;
        items.push({
          z,
          draw: () => {
            ctx.beginPath();
            ctx.moveTo(a[0], a[1]);
            ctx.lineTo(b[0], b[1]);
            ctx.lineCap = "round";
            ctx.lineWidth = TRACK_WIDTH * ((a[3] + b[3]) / 2);
            ctx.strokeStyle = palette[Math.round(trackShade(z) * SHADES)];
            ctx.stroke();
          },
        });
      }
    }
    return items;
  };

  /**
   * A solid line through `at`: the arc at `weight` 1, the track's width and
   * shade at 0.
   */
  const strand = (points: Projected[], at: number[], weight: number) => {
    const ends = at.map((u) => lerpAt(points, u, lerpProjected));
    const lineWidth =
      TRACK_WIDTH + (STROKE_WIDTH * radius - TRACK_WIDTH) * weight;
    return ends.slice(1).map((b, k): Item => {
      const a = ends[k];
      const z = (a[2] + b[2]) / 2;
      const f = (a[3] + b[3]) / 2;
      const shade = trackShade(z) + (arcShade(z) - trackShade(z)) * weight;
      return {
        z,
        draw: () => {
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(b[0], b[1]);
          // Erases a border first, so a strand crossing over another cuts a
          // gap in it, as at a knot diagram's crossings.
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineCap = "butt";
          ctx.lineWidth = (lineWidth + 5 * weight) * f;
          ctx.stroke();
          ctx.globalCompositeOperation = "source-over";
          ctx.lineCap = "round";
          ctx.lineWidth = lineWidth * f;
          ctx.strokeStyle = palette[Math.round(shade * SHADES)];
          ctx.stroke();
        },
      };
    });
  };

  const drawKnot = (m: Mat, { shown, finish }: KnotProgress) => {
    const points = KNOT.map((p) => project(m, p));
    let items: Item[];
    if (finish === 1) items = strand(points, stations(0, SAMPLES), 1);
    else {
      const start = (((tail % 1) + 1) % 1) * SAMPLES;
      const span = (MIN_ARC + (1 - MIN_ARC) * shown) * SAMPLES;
      const rest =
        finish > 0
          ? strand(
              points,
              stations(start + span, start + SAMPLES),
              1 - (1 - finish) ** 2,
            )
          : track(points, start, span);
      items = [...strand(points, stations(start, start + span), 1), ...rest];
    }
    items.sort((a, b) => a.z - b.z).forEach(({ draw }) => draw());
  };

  return {
    setStage: progress.setStage,
    draw: (dt) => {
      elapsed += dt;
      const now = progress.step(dt);
      const motion = still ? 0 : dt;
      tail += motion * TAIL_SPEED;
      const m = tumble(motion, elapsed);
      // Held still, the knot changes only as its arc grows, so a frame that
      // would grow it by under a quarter of a sample (under a pixel) is skipped.
      const changed =
        now.finish !== drawn.finish ||
        Math.abs(now.shown - drawn.shown) * SAMPLES >= 0.25;
      if (!still || changed) {
        ctx.clearRect(0, 0, width, height);
        drawKnot(m, now);
        drawn = now;
      }
    },
  };
};
