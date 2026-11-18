import {
  DataTexture,
  LinearFilter,
  NoColorSpace,
  RGBAFormat,
  UnsignedByteType,
} from "three/webgpu";
import type { Node } from "three/webgpu";
import { vec2 } from "three/tsl";
import type { ColorMap } from "@math3d/viewport-spec";

/** Texels per color map. */
export const COLOR_MAP_WIDTH = 256;

/**
 * Texel k holds `map(k / (COLOR_MAP_WIDTH − 1))`, as RGBA bytes:
 * `colorMapCoordinate`'s inverse.
 */
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
 * Where to sample a color map's texture for `position` in [0, 1]: 0 and 1
 * land on the centers of the end texels.
 */
export const colorMapCoordinate = (position: Node<"float">): Node<"vec2"> =>
  vec2(
    position
      .mul(COLOR_MAP_WIDTH - 1)
      .add(0.5)
      .div(COLOR_MAP_WIDTH),
    0.5,
  );

/**
 * Filtered, unmipmapped, clamped to its edges and with no color-space
 * conversion (the `color` attribute gets none either). `DataTexture` defaults to
 * nearest filtering.
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
 * The texture the periodic material is built with; each mesh then supplies
 * its own. It has the map textures' format and filters, since the shader
 * build reads them from this one.
 */
export const blankColorMap = (): DataTexture => {
  blank ??= makeTexture(new Uint8Array(4 * COLOR_MAP_WIDTH));
  return blank;
};
