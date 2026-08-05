import type { Page } from "@playwright/test";

/**
 * Fraction of pixels in a PNG screenshot that carry strong chroma (max channel
 * minus min channel), decoded via the browser's own image decoder and a 2D
 * canvas (no Node image library, and no unreliable WebGL read-back).
 *
 * Chroma is background-agnostic: white, black, and gray backgrounds, plus the
 * gray axes and grid lines, all read ~0, while the colored surface reads high.
 * So the metric isolates "the 3D surface actually drew" from a blank or
 * half-drawn capture, and is stable across GL backends (SwiftShader on CI vs a
 * real GPU locally) because it keys off gross color mass, not exact pixels.
 */
export const colorfulPixelRatio = (
  page: Page,
  pngBase64: string,
): Promise<number> =>
  page.evaluate(async (b64) => {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = `data:image/png;base64,${b64}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let colorful = 0;
    for (let i = 0; i < data.length; i += 4) {
      const chroma =
        Math.max(data[i], data[i + 1], data[i + 2]) -
        Math.min(data[i], data[i + 1], data[i + 2]);
      if (chroma > 40) colorful += 1;
    }
    return colorful / (data.length / 4);
  }, pngBase64);
