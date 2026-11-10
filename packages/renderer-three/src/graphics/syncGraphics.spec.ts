import { expect, test, vi } from "vitest";
import { Group } from "three/webgpu";
import type { PointSpec, ViewportGraphic } from "@math3d/viewport-spec";
import type { Graphic, GraphicBuilders } from "./builders";
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
  const built: Graphic[] = [];
  const builders: GraphicBuilders = {
    point: vi.fn(() => {
      const graphic = {
        object: new Group(),
        update: vi.fn(),
        dispose: vi.fn(),
      };
      built.push(graphic);
      return graphic;
    }),
  };
  const sync = (graphics: ViewportGraphic[]) =>
    syncGraphics(world, drawn, graphics, builders);
  return { world, drawn, built, builders, sync };
};

test("builds a new graphic into the world, and skips an unchanged spec", () => {
  const { world, built, builders, sync } = setup();
  const spec = point(1);

  sync([{ id: "a", spec }]);
  sync([{ id: "a", spec }]);

  expect(builders.point).toHaveBeenCalledOnce();
  expect(world.children).toEqual([built[0].object]);
  expect(built[0].update).not.toHaveBeenCalled();
});

test("a changed spec updates its graphic in place", () => {
  const { builders, built, sync } = setup();
  sync([{ id: "a", spec: point(1) }]);
  const next = point(2);

  sync([{ id: "a", spec: next }]);

  expect(builders.point).toHaveBeenCalledOnce();
  expect(built[0].update).toHaveBeenCalledExactlyOnceWith(next);
});

test("a graphic's renderOrder follows its item's place, without an update", () => {
  const { built, sync } = setup();
  const a = point(1);
  const b = point(2);
  sync([{ id: "a", spec: a }]);
  const [graphicA] = built;
  expect(graphicA.object.renderOrder).toBe(0);

  sync([
    { id: "b", spec: b },
    { id: "a", spec: a },
  ]);

  expect(built[1].object.renderOrder).toBe(0);
  expect(graphicA.object.renderOrder).toBe(1);
  expect(graphicA.update).not.toHaveBeenCalled();
});

test("a graphic that leaves the spec is removed and disposed", () => {
  const { world, drawn, built, sync } = setup();
  sync([{ id: "a", spec: point(1) }]);

  sync([]);

  expect(world.children).toEqual([]);
  expect(drawn.size).toBe(0);
  expect(built[0].dispose).toHaveBeenCalledOnce();
});
