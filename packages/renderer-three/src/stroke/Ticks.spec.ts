import { describe, expect, test } from "vitest";
import type { Coords } from "@math3d/viewport-spec";
import { Ticks } from "./Ticks";
import type { TickStyle } from "./Ticks";

const style: TickStyle = {
  width: 2,
  color: [0.2, 0.4, 0.6, 1],
  zBias: 0,
  zIndex: 0,
};

describe("Ticks", () => {
  test("draws a tick at each finite position, along the given direction", () => {
    const ticks = new Ticks();
    const positions: Coords[] = [
      [1, 0, 0],
      [NaN, 0, 0],
      [2, 0, 0],
    ];
    ticks.set(positions, [0, 1, 0], style);
    const { geometry } = ticks.mesh;
    const read = (name: string) => {
      const attribute = geometry.getAttribute(name);
      return Array.from({ length: geometry.instanceCount }, (_, i) => [
        attribute.getX(i),
        attribute.getY(i),
        attribute.getZ(i),
      ]);
    };
    expect(read("tickCenter")).toEqual([
      [1, 0, 0],
      [2, 0, 0],
    ]);
    expect(read("tickDirection")).toEqual([
      [0, 1, 0],
      [0, 1, 0],
    ]);
  });

  test("gives its mesh the style, as the stroke shaders read it", () => {
    const ticks = new Ticks();
    ticks.set([[0, 0, 0]], [0, 1, 0], style);
    const { color, width, zBias, zIndex } = ticks.mesh.userData.stroke;
    expect(color.toArray()).toEqual(style.color);
    expect({ width, zBias, zIndex }).toEqual({
      width: style.width,
      zBias: style.zBias,
      zIndex: style.zIndex,
    });
  });

  test("blends translucent ticks and not opaque ones", () => {
    const ticks = new Ticks();
    ticks.set([[0, 0, 0]], [0, 1, 0], { ...style, color: [1, 0, 0, 0.5] });
    expect(ticks.mesh.material.transparent).toBe(true);
    ticks.set([[0, 0, 0]], [0, 1, 0], style);
    expect(ticks.mesh.material.transparent).toBe(false);
  });
});
