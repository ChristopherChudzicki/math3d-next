import { expect, test, vi } from "vitest";
import { Group, Object3D } from "three/webgpu";
import type { PointSpec, ViewportGraphic } from "@math3d/viewport-spec";
import type { GraphicBuilders } from "./builders";
import { syncGraphics } from "./syncGraphics";
import type { DrawnGraphics } from "./syncGraphics";

const point = (x: number): PointSpec => ({
  kind: "point",
  positions: [[x, 0, 0]],
  size: 6,
  color: [0, 0, 0, 1],
  label: null,
  zBias: 0,
  zIndex: 0,
});

const setup = () => {
  const world = new Group();
  const drawn: DrawnGraphics = new Map();
  const graphic = { object: new Object3D(), update: vi.fn(), dispose: vi.fn() };
  const builders: GraphicBuilders = { point: vi.fn(() => graphic) };
  const sync = (graphics: ViewportGraphic[]) =>
    syncGraphics(world, drawn, graphics, builders);
  return { world, drawn, graphic, builders, sync };
};

test("builds a new graphic into the world, and skips an unchanged spec", () => {
  const { world, graphic, builders, sync } = setup();
  const spec = point(1);

  sync([{ id: "a", spec }]);
  sync([{ id: "a", spec }]);

  expect(builders.point).toHaveBeenCalledOnce();
  expect(world.children).toEqual([graphic.object]);
  expect(graphic.update).not.toHaveBeenCalled();
});

test("a changed spec updates its graphic in place", () => {
  const { builders, graphic, sync } = setup();
  sync([{ id: "a", spec: point(1) }]);
  const next = point(2);

  sync([{ id: "a", spec: next }]);

  expect(builders.point).toHaveBeenCalledOnce();
  expect(graphic.update).toHaveBeenCalledExactlyOnceWith(next);
});

test("a graphic that leaves the spec is removed and disposed", () => {
  const { world, drawn, graphic, sync } = setup();
  sync([{ id: "a", spec: point(1) }]);

  sync([]);

  expect(world.children).toEqual([]);
  expect(drawn.size).toBe(0);
  expect(graphic.dispose).toHaveBeenCalledOnce();
});
