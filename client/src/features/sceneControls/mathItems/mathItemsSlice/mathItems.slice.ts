import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { mathItemConfigs, MathItemType, assertIsMathItemType } from "@/configs";
import type { MathItem, MathItemPatch } from "@/configs";
import { keyBy } from "lodash";
import { assertNotNil } from "@/util/predicates";
import MathScope from "@/util/MathScope";

import { latexParser } from "@/util/parsing";
import {
  syncItemsToMathScope,
  removeItemsFromMathScope,
} from "./syncMathScope";
import type { MathItemsState } from "./interfaces";

const makeMathScope = () => new MathScope({ parse: latexParser.parse });

const getInitialState = (): MathItemsState => {
  const mathScope = makeMathScope();
  return {
    mathScope: () => mathScope,
    items: {},
    activeItemId: undefined,
    order: {},
  };
};

const MAIN_FOLDER = "main";
const getActiveFolderId = (
  order: MathItemsState["order"],
  itemId?: string
): string => {
  if (itemId === undefined) {
    const folderId = order[MAIN_FOLDER].at(-1);
    assertNotNil(folderId, "Main folder should have at least one child.");
    return folderId;
  }
  /**
   * If the item exists at tree root, then it's a folder.
   */
  if (order[itemId]) return itemId;
  const folderEntry = Object.entries(order).find(([_folderId, itemIds]) => {
    return itemIds.includes(itemId);
  });
  assertNotNil(folderEntry, "Could not find active folder.");
  return folderEntry[0];
};
const getParent = (order: MathItemsState["order"], itemId: string): string => {
  const parentFolderId = Object.keys(order).find((folderId) => {
    return order[folderId].includes(itemId);
  });
  assertNotNil(parentFolderId, "could not find item parent");
  return parentFolderId;
};

const insertAtIndex = <T>(array: T[], item: T, index: number) => {
  const insertionIndex = index < 0 ? array.length : index;
  array.splice(insertionIndex, 0, item);
};

const mathItemsSlice = createSlice({
  name: "mathItems",
  initialState: getInitialState,
  reducers: {
    setItems: (
      state,
      action: PayloadAction<{
        items: MathItem[];
        order: MathItemsState["order"];
      }>
    ) => {
      const { items, order } = action.payload;
      state.items = keyBy(items, (item) => item.id);
      state.order = order;
      state.activeItemId = undefined;
      const mathScope = makeMathScope();
      state.mathScope = () => mathScope;
      syncItemsToMathScope(mathScope, items);
    },
    initializeMathScope: (state) => {
      const items = Object.values(state.items);
      syncItemsToMathScope(state.mathScope(), items);
    },
    addNewItem: (
      state,
      action: PayloadAction<{ type: MathItemType; id: string }>
    ) => {
      const { type, id } = action.payload;
      const item = mathItemConfigs[type].make(id);
      state.items[id] = item;

      const isFolder = type === MathItemType.Folder;
      const activeFolderId = getActiveFolderId(state.order, state.activeItemId);
      const targetFolderId = isFolder ? MAIN_FOLDER : activeFolderId;
      const insertAfterId = isFolder ? activeFolderId : state.activeItemId;
      assertNotNil(targetFolderId);
      const folderItems = state.order[targetFolderId];
      const atIndex =
        folderItems.findIndex((itemId) => itemId === insertAfterId) + 1;
      insertAtIndex(state.order[targetFolderId], id, atIndex);
      if (isFolder) {
        state.order[id] = [];
      }
      if (state.items[targetFolderId]) {
        const folder = state.items[targetFolderId];
        assertIsMathItemType(folder.type, MathItemType.Folder);
        folder.properties.isCollapsed = "false";
        syncItemsToMathScope(state.mathScope(), [folder]);
      }
      state.activeItemId = id;

      syncItemsToMathScope(state.mathScope(), [item]);
    },
    setActiveItem: (state, action: PayloadAction<{ id: string }>) => {
      state.activeItemId = action.payload.id;
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      const item = state.items[id];
      delete state.items[id];

      const { order } = state;
      const parentFolderId = getParent(state.order, id);
      order[parentFolderId] = order[parentFolderId].filter(
        (itemId) => itemId !== id
      );

      if (state.activeItemId === id) {
        state.activeItemId = undefined;
      }

      removeItemsFromMathScope(state.mathScope(), [item]);
    },
    setProperties: (
      state,
      action: PayloadAction<MathItemPatch<MathItemType>>
    ) => {
      const { id, properties: newProperties } = action.payload;
      const { properties: oldProperties } = state.items[id];
      state.items[id].properties = { ...oldProperties, ...newProperties };

      const item = state.items[id];
      syncItemsToMathScope(state.mathScope(), [item]);
    },
    move: (
      state,
      action: PayloadAction<{ id: string; newParent: string; newIndex: number }>
    ) => {
      const { id, newParent, newIndex } = action.payload;
      const oldParent = getParent(state.order, id);
      state.order[oldParent] = state.order[oldParent].filter((x) => x !== id);
      insertAtIndex(state.order[newParent], id, newIndex);
    },
  },
});

export type { MathItemsState };
export const { actions, reducer } = mathItemsSlice;
export default mathItemsSlice;
