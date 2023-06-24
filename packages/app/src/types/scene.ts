import { MathItem } from "@math3d/mathitem-configs";

export interface Scene {
  key: string;
  title: string;
  items: MathItem[];
  itemOrder: Record<string, string[]>;
}
