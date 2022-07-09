import { MathItem } from "configs";

export type ItemOrder = {
  tree: Record<string, string[]>;
  activeItemId: string;
};

export interface Scene {
  id: string;
  title: string;
  items: MathItem[];
  itemOrder: ItemOrder;
}
