import type { Material } from "three/webgpu";
import { accumulates } from "./shader/material";

/** The fields of three's `RenderItem` that the sorts read. */
type Drawn = {
  groupOrder: number | null;
  renderOrder: number | null;
  id: number | null;
  material: Material | null;
};

/** Items in the spec's order, an item's parts in their own: never by depth. */
export const inDrawOrder = (a: Drawn, b: Drawn): number =>
  (a.groupOrder ?? 0) - (b.groupOrder ?? 0) ||
  (a.renderOrder ?? 0) - (b.renderOrder ?? 0) ||
  (a.id ?? 0) - (b.id ?? 0);

const accumulating = ({ material }: Drawn) =>
  material !== null && accumulates(material);

/**
 * Draw order, but accumulating marks after all others: `OitFrame`, which
 * sorts with it, tests them against the depth the others write.
 */
export const accumulatingLast = (a: Drawn, b: Drawn): number =>
  Number(accumulating(a)) - Number(accumulating(b)) || inDrawOrder(a, b);
