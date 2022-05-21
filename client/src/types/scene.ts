import { MathItem } from "configs";

export type SortableTree = Record<string, string[]>;

export interface Scene {
  id: string;
  title: string;
  items: MathItem[];
  sortableTree: SortableTree;
}
