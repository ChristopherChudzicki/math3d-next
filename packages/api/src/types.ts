import { MathItem } from "@math3d/mathitem-configs";
import { Scene as ApiScene } from "./generated";

// Derived from the v0-generated Scene (items/itemOrder are `any` there);
// repoint to the v1 client + full removal is #1125.
export interface StrictScene
  extends Omit<Required<ApiScene>, "items" | "itemOrder"> {
  items: MathItem[];
  itemOrder: Record<string, string[]>;
}
