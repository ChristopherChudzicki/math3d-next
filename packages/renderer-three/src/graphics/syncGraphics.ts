import type { Group } from "three/webgpu";
import type { GraphicSpec, ViewportGraphic } from "@math3d/viewport-spec";
import type { Transparency } from "../shader/material";
import type { Graphic, GraphicBuilders } from "./builders";

export type DrawnGraphics = Map<
  string,
  { spec: GraphicSpec; graphic: Graphic }
>;

const build = (
  spec: GraphicSpec,
  builders: GraphicBuilders,
  transparency: Transparency,
) => {
  const builder = builders[spec.kind] as
    | ((s: GraphicSpec, t: Transparency) => Graphic)
    | undefined;
  return builder?.(spec, transparency) ?? null;
};

/**
 * Brings `drawn` and `world`'s children in line with `graphics`. An item's
 * graphic kind never changes, so a changed spec updates its graphic in place.
 * Each graphic's `renderOrder` is its item's place in the list.
 */
export const syncGraphics = (
  world: Group,
  drawn: DrawnGraphics,
  graphics: ViewportGraphic[],
  builders: GraphicBuilders,
  transparency: Transparency,
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
      entry.graphic.object.renderOrder = order;
      if (entry.spec === spec) return;
      entry.graphic.update(spec);
      entry.spec = spec;
      return;
    }
    const graphic = build(spec, builders, transparency);
    if (!graphic) return;
    graphic.object.renderOrder = order;
    world.add(graphic.object);
    drawn.set(id, { spec, graphic });
  });
};
