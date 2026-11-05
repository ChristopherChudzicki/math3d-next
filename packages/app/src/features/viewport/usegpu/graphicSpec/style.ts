import tinycolor from "tinycolor2";
import type { RGBA } from "./types";

/** An item label's text when it should be drawn, else `null`. */
export const visibleLabel = (
  text: string,
  visible: boolean | undefined,
): string | null => (visible && text ? text : null);

const DEFAULT_COLOR = "#3090ff";

/** Any color tinycolor parses, to RGBA in [0, 1]; anything else (e.g. a gradient name) falls back to the default blue. */
export const parseColor = (text: string, opacity: number): RGBA => {
  const parsed = tinycolor(text);
  const { r, g, b } = (
    parsed.isValid() ? parsed : tinycolor(DEFAULT_COLOR)
  ).toRgb();
  const alpha = Number.isFinite(opacity)
    ? Math.min(Math.max(opacity, 0), 1)
    : 1;
  return [r / 255, g / 255, b / 255, alpha];
};

type BaseResults = {
  opacity?: number;
  zBias?: number;
  zIndex?: number;
};

/** Color and depth ordering, defaulted until their results evaluate. */
export const baseStyle = (
  { opacity, zBias, zIndex }: BaseResults,
  color: string,
): { color: RGBA; zBias: number; zIndex: number } => ({
  color: parseColor(color, opacity ?? 1),
  zBias: zBias ?? 0,
  zIndex: zIndex ?? 0,
});

/** A sample count of at least 2, so samplers never step by Δ/0. */
export const sampleCount = (n: number | undefined, fallback: number): number =>
  Math.max(2, Math.round(n ?? fallback));
