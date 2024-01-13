import { MathItem } from "@math3d/mathitem-configs";
import { Scene as ApiScene } from "@math3d/api";

export interface Scene extends Omit<Required<ApiScene>, "items" | "itemOrder"> {
  items: MathItem[];
  itemOrder: Record<string, string[]>;
}
