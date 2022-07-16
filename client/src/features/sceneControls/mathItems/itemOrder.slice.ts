import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState, SelectorReturn } from "store/store";
import { assertNotNil } from "util/predicates";
import { MathItemType } from "configs";
import { Scene } from "types";
import { actions as mathItemActions } from "./mathItems.slice";

import defaultScene from "../defaultScene";

export type ItemOrderState = {
  tree: Record<string, string[]>;
  activeItemId: string | undefined;
};

const getInitialState = (): ItemOrderState => ({
  tree: defaultScene.itemOrder,
  activeItemId: undefined,
});

const MAIN_FOLDER = "main";

const getActiveFolderId = (state: ItemOrderState, itemId?: string): string => {
  if (itemId === undefined) {
    const folderId = state.tree[MAIN_FOLDER].at(-1);
    assertNotNil(folderId, "Main folder should have at least one child.");
    return folderId;
  }
  /**
   * If the item exists at tree root, then it's a folder.
   */
  if (state.tree[itemId]) return itemId;
  const folderEntry = Object.entries(state.tree).find(
    ([_folderId, itemIds]) => {
      return itemIds.includes(itemId);
    }
  );
  assertNotNil(folderEntry, "Could not find active folder.");
  return folderEntry[0];
};

const itemOrderSlice = createSlice({
  name: "itemOrder",
  initialState: getInitialState,
  reducers: {
    addTree: (state, action: PayloadAction<{ tree: Scene["itemOrder"] }>) => {
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
        const activeFolderId = getActiveFolderId(state, state.activeItemId);
        const targetFolderId = isFolder ? MAIN_FOLDER : activeFolderId;
        const insertAfterId = isFolder ? activeFolderId : state.activeItemId;
        assertNotNil(targetFolderId);
        const folderItems = state.tree[targetFolderId];
        const insertAfterIndex = folderItems.findIndex(
          (itemId) => itemId === insertAfterId
        );
        const insertionIndex =
          insertAfterIndex < 0 ? folderItems.length : insertAfterIndex + 1;
        state.tree[targetFolderId].splice(insertionIndex, 0, id);
        if (isFolder) {
          state.tree[id] = [];
        }
        state.activeItemId = id;
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
