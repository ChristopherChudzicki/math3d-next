import type { ParseableObjs } from "@math3d/parser";

const fallbacks = { fps: 60, min: -5, max: 5, value: 0, duration: 4 };

type SliderResults = Partial<
  Record<"fps" | "range" | "value" | "duration", unknown>
>;

/**
 * Results keep their last valid value while an expression errors, so the
 * fallbacks only apply until the first valid evaluation.
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

const getSliderParameters = (
  min: number,
  max: number,
  fps: number,
  baseDuration: number,
  speedMultiplier = 1,
) => {
  const duration = baseDuration / speedMultiplier;
  const frames = fps * duration;
  const baseFrames = fps * baseDuration;
  const range = max - min;
  const increment = range / frames;
  const baseIncrement = range / baseFrames;
  return { increment, baseIncrement };
};

const valueAssignment = (
  lhs: string,
  v: number,
): ParseableObjs["assignment"] => ({
  lhs,
  rhs: `${v > 0 ? "+" : ""}${v}`,
  type: "assignment",
});

export { sliderNumbers, wrap, getSliderParameters, valueAssignment };
