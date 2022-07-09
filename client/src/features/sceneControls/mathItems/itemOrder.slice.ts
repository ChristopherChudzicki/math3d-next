import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState, SelectorReturn } from "store/store";
import { assertNotNil } from "util/predicates";
import { MathItemType } from "configs";
import type { ItemOrder } from "types";
import { actions as mathItemActions } from "./mathItems.slice";

import defaultScene from "../defaultScene";

export type ItemOrderState = ItemOrder;

const getInitialState = (): ItemOrderState => defaultScene.itemOrder;

const MAIN_FOLDER = "main";

const itemOrderSlice = createSlice({
  name: "itemOrder",
  initialState: getInitialState,
  reducers: {
    addNodes: (state, action: PayloadAction<ItemOrderState>) => {
      return { ...state, ...action.payload };
    },
    setActiveItem: (state, action: PayloadAction<{ id: string }>) => {
      state.activeItemId = action.payload.id;
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(mathItemActions.addNewItem, (state, action) => {
        const { id, type } = action.payload;
        const isFolder = type === MathItemType.Folder;
        const targetFolderId = isFolder
          ? MAIN_FOLDER
          : state.tree[MAIN_FOLDER].at(-1);
        assertNotNil(targetFolderId);
        state.tree[targetFolderId].push(id);
        if (isFolder) {
          state.tree[id] = [];
        }
      })
      .addCase(mathItemActions.remove, (state, action) => {
        const { tree } = state;
        const { id } = action.payload;
        const parentFolderId = Object.keys(tree).find((folderId) => {
          return tree[folderId].includes(id);
        });
        assertNotNil(parentFolderId);
        tree[parentFolderId] = tree[parentFolderId].filter(
          (itemId) => itemId !== id
        );
      }),
});

interface Subtree {
  id: string;
  children?: Subtree[];
}

const getSubtree = (
  state: ItemOrderState,
  node: Subtree,
  depth = 0
): Subtree => {
  if (node.children) return node;
  if (!state.tree[node.id]) return node;
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
  const children = state.tree[node.id].map((id) => {
    return getSubtree(state, { id }, depth + 1);
  });
  return { ...node, children };
};

export const selectSubtree =
  (rootId: string): SelectorReturn<Subtree> =>
  (state: RootState) =>
    getSubtree(state.itemOrder, { id: rootId });

export const selectIsActive =
  (id: string): SelectorReturn<boolean> =>
  (state: RootState) =>
    state.itemOrder.activeItemId === id;

export const { actions, reducer } = itemOrderSlice;
export default itemOrderSlice;
