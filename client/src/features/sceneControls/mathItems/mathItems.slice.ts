import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  MathItem,
  mathItemConfigs,
  MathItemPatch,
  MathItemType,
} from "configs";
import { keyBy } from "lodash";
import { useAppSelector } from "store/hooks";
import type { RootState, SelectorReturn } from "store/store";
import { assertNotNil } from "util/predicates";

import defaultScene from "../defaultScene";

export interface MathItemsState {
  items: {
    [id: string]: MathItem;
  };
  order: Record<string, string[]>;
  activeItemId: string | undefined;
}

const getInitialState = (): MathItemsState => ({
  items: keyBy(defaultScene.items, (item) => item.id),
  activeItemId: undefined,
  order: defaultScene.itemOrder,
});

const MAIN_FOLDER = "main";
const getActiveFolderId = (state: MathItemsState, itemId?: string): string => {
  if (itemId === undefined) {
    const folderId = state.order[MAIN_FOLDER].at(-1);
    assertNotNil(folderId, "Main folder should have at least one child.");
    return folderId;
  }
  /**
   * If the item exists at tree root, then it's a folder.
   */
  if (state.order[itemId]) return itemId;
  const folderEntry = Object.entries(state.order).find(
    ([_folderId, itemIds]) => {
      return itemIds.includes(itemId);
    }
  );
  assertNotNil(folderEntry, "Could not find active folder.");
  return folderEntry[0];
};
const getParent = (state: MathItemsState, itemId: string): string => {
  const { order } = state;
  const parentFolderId = Object.keys(order).find((folderId) => {
    return order[folderId].includes(itemId);
  });
  assertNotNil(parentFolderId, "could not find item parent");
  return parentFolderId;
};

const mathItemsSlice = createSlice({
  name: "mathItems",
  initialState: getInitialState,
  reducers: {
    addItems: (state, action: PayloadAction<{ items: MathItem[] }>) => {
      throw new Error("Not implemented");
      console.log(action);
    },
    addNewItem: (
      state,
      action: PayloadAction<{ type: MathItemType; id: string }>
    ) => {
      const { type, id } = action.payload;
      const item = mathItemConfigs[type].make(id);
      state.items[id] = item;

      const isFolder = type === MathItemType.Folder;
      const activeFolderId = getActiveFolderId(state, state.activeItemId);
      const targetFolderId = isFolder ? MAIN_FOLDER : activeFolderId;
      const insertAfterId = isFolder ? activeFolderId : state.activeItemId;
      assertNotNil(targetFolderId);
      const folderItems = state.order[targetFolderId];
      const insertAfterIndex = folderItems.findIndex(
        (itemId) => itemId === insertAfterId
      );
      const insertionIndex =
        insertAfterIndex < 0 ? folderItems.length : insertAfterIndex + 1;
      state.order[targetFolderId].splice(insertionIndex, 0, id);
      if (isFolder) {
        state.order[id] = [];
      }
      state.activeItemId = id;
    },
    setActiveItem: (state, action: PayloadAction<{ id: string }>) => {
      state.activeItemId = action.payload.id;
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      delete state.items[id];

      const { order } = state;
      const parentFolderId = getParent(state, id);
      order[parentFolderId] = order[parentFolderId].filter(
        (itemId) => itemId !== id
      );
    },
    setProperties: (
      state,
      action: PayloadAction<MathItemPatch<MathItemType>>
    ) => {
      const { id, properties: newProperties } = action.payload;
      const { properties: oldProperties } = state.items[id];
      state.items[id].properties = { ...oldProperties, ...newProperties };
    },
  },
});

export const selectMathItems =
  (): SelectorReturn<MathItemsState["items"]> => (state: RootState) =>
    state.mathItems.items;

export const selectMathItem =
  (id: string): SelectorReturn<MathItem> =>
  (state: RootState) =>
    state.mathItems.items[id];

export const useMathItem = (id: string) => {
  const mathItem = useAppSelector(selectMathItem(id));
  return mathItem;
};

interface Subtree {
  id: string;
  children?: Subtree[];
}

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
    return getSubtree(state, { id }, depth + 1);
  });
  return { ...node, children };
};

export const selectSubtree =
  (rootId: string): SelectorReturn<Subtree> =>
  (state: RootState) =>
    getSubtree(state.mathItems, { id: rootId });

export const selectIsActive =
  (id: string): SelectorReturn<boolean> =>
  (state: RootState) =>
    state.mathItems.activeItemId === id;

export const { actions, reducer } = mathItemsSlice;
export default mathItemsSlice;
