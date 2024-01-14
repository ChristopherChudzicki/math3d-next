import { MathItem } from "@math3d/mathitem-configs";
import { Scene as ApiScene } from "./generated";

export interface StrictScene
  extends Omit<Required<ApiScene>, "items" | "itemOrder"> {
  items: MathItem[];
  itemOrder: Record<string, string[]>;
}
