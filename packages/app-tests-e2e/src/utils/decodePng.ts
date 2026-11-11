import sharp from "sharp";

export type Pixels = { width: number; height: number; data: Uint8Array };

/** A PNG's pixels as RGBA bytes, row by row from the top left. */
export const decodePng = async (png: Buffer): Promise<Pixels> => {
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data };
};
