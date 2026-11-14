import {
  DataTexture,
  LinearFilter,
  NoColorSpace,
  RGBAFormat,
  UnsignedByteType,
} from "three/webgpu";
import type { ColorMap } from "@math3d/viewport-spec";

/** Texels per color map. */
export const COLOR_MAP_WIDTH = 256;

/** Texel k holds `map(k / (COLOR_MAP_WIDTH − 1))`, as RGBA bytes. */
export const colorMapTexels = (map: ColorMap): Uint8Array => {
  const texels = new Uint8Array(4 * COLOR_MAP_WIDTH);
  const byte = (c: number) => Math.round(Math.min(Math.max(c, 0), 1) * 255);
  for (let k = 0; k < COLOR_MAP_WIDTH; k += 1) {
    const [r, g, b] = map(k / (COLOR_MAP_WIDTH - 1));
    texels.set([byte(r), byte(g), byte(b), 255], 4 * k);
  }
  return texels;
};

/**
 * Filtered, unmipmapped, clamped to its edges and with no color-space
 * conversion, as the color attribute is drawn. `DataTexture` defaults to
 * nearest filtering, which WebGPU would sample unfiltered.
 */
const makeTexture = (texels: Uint8Array): DataTexture => {
  const texture = new DataTexture(
    texels,
    COLOR_MAP_WIDTH,
    1,
    RGBAFormat,
    UnsignedByteType,
  );
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  return texture;
};

const textures = new WeakMap<ColorMap, DataTexture>();

/** One texture per map, built on first use. */
export const colorMapTexture = (map: ColorMap): DataTexture => {
  let texture = textures.get(map);
  if (!texture) {
    texture = makeTexture(colorMapTexels(map));
    textures.set(map, texture);
  }
  return texture;
};

let blank: DataTexture | undefined;

/**
 * What an unmapped mesh samples. It has the map textures' format and filters,
 * since the shader build reads them from the texture it is built with.
 */
export const blankColorMap = (): DataTexture => {
  blank ??= makeTexture(new Uint8Array(4 * COLOR_MAP_WIDTH));
  return blank;
};
