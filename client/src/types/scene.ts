import { MathItem } from "./mathItem";

export type SortableTree = Record<string, string[]>;

export type Scene = {
  id: string;
  title: string;
  items: MathItem[];
  sortableTree: SortableTree;
};
