import type { Group } from "three/webgpu";
import type { GraphicSpec, ViewportGraphic } from "@math3d/viewport-spec";
import type { Graphic, GraphicBuilders } from "./builders";

export type DrawnGraphics = Map<
  string,
  { spec: GraphicSpec; order: number; graphic: Graphic }
>;

const build = (spec: GraphicSpec, order: number, builders: GraphicBuilders) => {
  const builder = builders[spec.kind] as
    | ((s: GraphicSpec, o: number) => Graphic)
    | undefined;
  return builder?.(spec, order) ?? null;
};

/**
 * Brings `drawn` and `world`'s children in line with `graphics`. An item's
 * graphic kind never changes, so a changed spec or place in the list updates
 * its graphic in place.
 */
export const syncGraphics = (
  world: Group,
  drawn: DrawnGraphics,
  graphics: ViewportGraphic[],
  builders: GraphicBuilders,
): void => {
  const ids = new Set(graphics.map(({ id }) => id));
  drawn.forEach(({ graphic }, id) => {
    if (ids.has(id)) return;
    world.remove(graphic.object);
    graphic.dispose();
    drawn.delete(id);
  });
  graphics.forEach(({ id, spec }, order) => {
    const entry = drawn.get(id);
    if (entry) {
      if (entry.spec === spec && entry.order === order) return;
      entry.graphic.update(spec, order);
      entry.spec = spec;
      entry.order = order;
      return;
    }
    const graphic = build(spec, order, builders);
    if (!graphic) return;
    world.add(graphic.object);
    drawn.set(id, { spec, order, graphic });
  });
};
