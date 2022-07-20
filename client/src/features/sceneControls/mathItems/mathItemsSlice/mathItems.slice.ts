import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { mathItemConfigs } from "configs";
import type { MathItem, MathItemPatch, MathItemType } from "configs";
import { keyBy } from "lodash";
import { assertNotNil } from "util/predicates";

import defaultScene from "../../defaultScene";

interface MathItemsState {
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
    addItems: (_state, _action: PayloadAction<{ items: MathItem[] }>) => {
      throw new Error("Not implemented");
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

export type { MathItemsState };
export const { actions, reducer } = mathItemsSlice;
export default mathItemsSlice;
