import { vi } from "vitest";
import type { AtlasSurface, LabelText } from "../LabelAtlas";

/** For tests: rasters 10 CSS px wide per character and 20 tall, at the given ratio. */
export const fakeSurface = () => ({
  measure: vi.fn(({ text }: LabelText, ratio: number): [number, number] => [
    10 * text.length * ratio,
    20 * ratio,
  ]),
  reset: vi.fn<AtlasSurface["reset"]>(),
  draw: vi.fn<AtlasSurface["draw"]>(),
});
