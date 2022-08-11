import type { SelectorReturn, RootState } from "store/store";
import type { MathItem } from "configs";
import MathScope from "util/MathScope";
import type { MathItemsState, Subtree } from "./interfaces";

const mathItems =
  (): SelectorReturn<MathItemsState["items"]> => (state: RootState) =>
    state.mathItems.items;

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

const mathScope = (): SelectorReturn<MathScope> => (state: RootState) =>
  state.mathItems.mathScope();

export { subtree, isActive, mathItems, mathItem, mathScope };
export type { Subtree };
