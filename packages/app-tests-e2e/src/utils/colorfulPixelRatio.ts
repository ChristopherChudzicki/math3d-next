import { decodePng } from "@/utils/decodePng";

/**
 * Fraction of pixels in a PNG screenshot that carry strong chroma (max channel
 * minus min channel).
 *
 * Chroma is background-agnostic: white, black, and gray backgrounds, plus the
 * gray axes and grid lines, all read ~0, while the colored surface reads high.
 * So the metric isolates "the 3D surface actually drew" from a blank or
 * half-drawn capture, and is stable across GL backends (SwiftShader on CI vs a
 * real GPU locally) because it keys off gross color mass, not exact pixels.
 */
export const colorfulPixelRatio = async (png: Buffer): Promise<number> => {
  const { data } = await decodePng(png);
  let colorful = 0;
  for (let i = 0; i < data.length; i += 4) {
    const chroma =
      Math.max(data[i], data[i + 1], data[i + 2]) -
      Math.min(data[i], data[i + 1], data[i + 2]);
    if (chroma > 40) colorful += 1;
  }
  return colorful / (data.length / 4);
};
