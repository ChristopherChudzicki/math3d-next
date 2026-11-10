import type { Group } from "three/webgpu";
import type { GraphicSpec } from "@math3d/viewport-spec";

export type SpecOf<K extends GraphicSpec["kind"]> = Extract<
  GraphicSpec,
  { kind: K }
>;

/**
 * A drawn graphic. `object` holds math coordinates. `syncGraphics` sets its
 * `renderOrder`, which three sorts on before any part's own `renderOrder`;
 * parts' `renderOrder` orders them within the item. A `Group` nested inside
 * replaces the item's order for its parts.
 */
export type Graphic<S extends GraphicSpec = GraphicSpec> = {
  object: Group;
  /** Redraws for a new spec of the same kind. */
  update(spec: S): void;
  dispose(): void;
};

/** One builder per graphic kind; a kind without one isn't drawn. */
export type GraphicBuilders = {
  [K in GraphicSpec["kind"]]?: (spec: SpecOf<K>) => Graphic<SpecOf<K>>;
};

export const builders: GraphicBuilders = {};
