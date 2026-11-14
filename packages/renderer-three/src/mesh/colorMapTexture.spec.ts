import { describe, expect, test } from "vitest";
import { LinearFilter } from "three/webgpu";
import {
  COLOR_MAP_WIDTH,
  colorMapTexels,
  colorMapTexture,
} from "./colorMapTexture";

describe("colorMapTexels", () => {
  test("holds the map at k / (width − 1) in texel k", () => {
    const texels = colorMapTexels((t) => [t, 1 - t, 0.5]);
    const texel = (k: number) => Array.from(texels.slice(4 * k, 4 * k + 4));
    expect(texel(0)).toEqual([0, 255, 128, 255]);
    expect(texel(51)).toEqual([51, 204, 128, 255]);
    expect(texel(COLOR_MAP_WIDTH - 1)).toEqual([255, 0, 128, 255]);
  });
});

describe("colorMapTexture", () => {
  test("builds one texture per map", () => {
    const map = (t: number): [number, number, number] => [t, t, t];
    const other = (t: number): [number, number, number] => [t, 0, 0];
    expect(colorMapTexture(map)).toBe(colorMapTexture(map));
    expect(colorMapTexture(other)).not.toBe(colorMapTexture(map));
  });

  test("filters linearly, without mipmaps", () => {
    const texture = colorMapTexture((t) => [t, t, t]);
    expect(texture).toMatchObject({
      magFilter: LinearFilter,
      minFilter: LinearFilter,
      generateMipmaps: false,
    });
  });
});
