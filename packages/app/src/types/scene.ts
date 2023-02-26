import { MathItem } from "@math3d/mathitem-configs";

export interface Scene {
  id: string;
  title: string;
  items: MathItem[];
  itemOrder: Record<string, string[]>;
}
