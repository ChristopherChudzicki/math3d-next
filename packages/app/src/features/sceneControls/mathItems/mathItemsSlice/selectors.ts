import type { SelectorReturn, RootState } from "@/store/store";
import type { MathItem } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import type { MathItemsState, AppMathScope, Subtree } from "./interfaces";

const title =
  (): SelectorReturn<MathItemsState["title"]> => (state: RootState) =>
    state.mathItems.title;

const mathItems =
  (): SelectorReturn<MathItemsState["items"]> => (state: RootState) =>
    state.mathItems.items;

const orderedMathItems = (): SelectorReturn<MathItem[]> => (state: RootState) =>
  Object.values(state.mathItems.items).sort((a, b) => a.id.localeCompare(b.id));

const mathItem =
  (id: string): SelectorReturn<MathItem> =>
  (state: RootState) =>
    state.mathItems.items[id];

const getSubtree = (
  state: MathItemsState,
  node: Subtree,
  depth = 0
): Subtree => {
  if (node.children) return node;
  if (!state.order[node.id]) return node;
  if (depth > 2) {
    /**
     * Sanity check. Math3d UI does not support nesting folders.
     * Max depth should be 2:
     * root
     *    userFolder1
     *      item1a
     *      item1b
     *    userFolder2
     *      ...etc
     */
    throw new Error("Depth should not be greater than 2.");
  }
  const children = state.order[node.id].map((id) => {
    return getSubtree(state, { id, parent: null }, depth + 1);
  });
  const nodeWithChildren = { ...node, children };
  children.forEach((child) => {
    // eslint-disable-next-line no-param-reassign
    child.parent = nodeWithChildren;
  });
  return nodeWithChildren;
};

const subtree =
  (rootId: string): SelectorReturn<Subtree> =>
  (state: RootState) =>
    getSubtree(state.mathItems, { id: rootId, parent: null });

const isActive =
  (id: string): SelectorReturn<boolean> =>
  (state: RootState) =>
    state.mathItems.activeItemId === id;

const mathScope = (): SelectorReturn<AppMathScope> => (state: RootState) =>
  state.mathItems.mathScope();

const getItems =
  (ids: string[]): SelectorReturn<MathItem[]> =>
  (state: RootState) => {
    const { items } = state.mathItems;
    return ids.map((id) => {
      invariant(items[id], `MathItem with id ${id} not found.`);
      return items[id];
    });
  };

const hasItems =
  (ids: string[]): SelectorReturn<boolean> =>
  (state: RootState) => {
    const { items } = state.mathItems;
    return ids.every((id) => items[id]);
  };

export {
  title,
  subtree,
  isActive,
  mathItems,
  mathItem,
  mathScope,
  orderedMathItems,
  hasItems,
  getItems,
};
export type { Subtree };
