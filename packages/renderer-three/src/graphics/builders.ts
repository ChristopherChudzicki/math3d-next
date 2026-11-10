import type { Object3D } from "three/webgpu";
import type { GraphicSpec } from "@math3d/viewport-spec";

export type SpecOf<K extends GraphicSpec["kind"]> = Extract<
  GraphicSpec,
  { kind: K }
>;

/**
 * A drawn graphic. `object` holds math coordinates. `order` is the item's
 * place in the item list: three breaks `renderOrder` and depth ties by
 * creation order, so a graphic folds `order` into `renderOrder` itself.
 */
export type Graphic<S extends GraphicSpec = GraphicSpec> = {
  object: Object3D;
  /** Redraws for a new spec of the same kind, or a new place in the list. */
  update(spec: S, order: number): void;
  dispose(): void;
};

/** One builder per graphic kind; a kind without one isn't drawn. */
export type GraphicBuilders = {
  [K in GraphicSpec["kind"]]?: (
    spec: SpecOf<K>,
    order: number,
  ) => Graphic<SpecOf<K>>;
};

export const builders: GraphicBuilders = {};
