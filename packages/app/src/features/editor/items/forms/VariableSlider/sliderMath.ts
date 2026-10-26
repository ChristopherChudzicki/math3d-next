import type { ParseableObjs } from "@math3d/parser";

type SpeedOption = {
  value: string;
  label: string;
  numeric: number;
};

const normalSpeed: SpeedOption = { value: "1", label: "1", numeric: 1 };

const speedOptions: SpeedOption[] = [
  { value: "1/16", label: "1\u204416", numeric: 1 / 16 },
  { value: "1/8", label: "1\u20448", numeric: 1 / 8 },
  { value: "1/4", label: "1\u20444", numeric: 1 / 4 },
  { value: "1/2", label: "1\u20442", numeric: 1 / 2 },
  { value: "3/4", label: "3\u20444", numeric: 3 / 4 },
  normalSpeed,
  { value: "2", label: "2", numeric: 2 },
  { value: "4", label: "4", numeric: 4 },
  { value: "8", label: "8", numeric: 8 },
];

/**
 * The option for a saved speed. Saved speeds aren't validated (by the backend
 * or legacy migration), so an unrecognized one plays at speed 1.
 */
const findSpeed = (value: string): SpeedOption =>
  speedOptions.find((o) => o.value === value) ?? normalSpeed;

/** The next faster (+1) or slower (-1) option, if any. */
const adjacentSpeed = (
  speed: SpeedOption,
  step: 1 | -1,
): SpeedOption | undefined =>
  speedOptions[speedOptions.findIndex((o) => o.value === speed.value) + step];

const fallbacks = { fps: 60, min: -5, max: 5, value: 0, duration: 4 };

type SliderResults = Partial<
  Record<"fps" | "range" | "value" | "duration", unknown>
>;

/**
 * A slider's evaluated numbers, with fallbacks. Results keep their last valid
 * value while an expression errors, so the fallbacks apply only until the
 * first valid evaluation.
 */
const sliderNumbers = (results: SliderResults) => {
  const range = results.range as [number, number] | undefined;
  return {
    fps: typeof results.fps === "number" ? results.fps : fallbacks.fps,
    min: range ? range[0] : fallbacks.min,
    max: range ? range[1] : fallbacks.max,
    value: typeof results.value === "number" ? results.value : fallbacks.value,
    duration:
      typeof results.duration === "number"
        ? results.duration
        : fallbacks.duration,
  };
};

const trueMod = (x: number, modulus: number) => {
  const y = x % modulus;
  return y < 0 ? y + modulus : y;
};

const wrap = (x: number, min: number, max: number) =>
  min + trueMod(x - min, max - min);

/**
 * The value change per frame at speed 1: one `duration` covers the range.
 */
const sliderStep = (min: number, max: number, fps: number, duration: number) =>
  (max - min) / (fps * duration);

const valueAssignment = (
  lhs: string,
  v: number,
): ParseableObjs["assignment"] => ({
  lhs,
  rhs: `${v > 0 ? "+" : ""}${v}`,
  type: "assignment",
});

export {
  findSpeed,
  adjacentSpeed,
  sliderNumbers,
  wrap,
  sliderStep,
  valueAssignment,
};
export type { SpeedOption };
