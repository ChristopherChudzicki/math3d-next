import { createSlice, PayloadAction, Draft, isDraft } from "@reduxjs/toolkit";
import { mathItemConfigs, MathItemType } from "configs";
import type { MathItem, MathItemPatch } from "configs";
import { keyBy } from "lodash";
import { assertNotNil } from "util/predicates";
import MathScope from "util/MathScope";

import { latexParser } from "util/parsing";
import defaultScene from "../../defaultScene";
import {
  syncItemsToMathScope,
  removeItemsFromMathScope,
} from "./syncMathScope";

interface MathItemsState {
  mathScope: MathScope;
  items: {
    [id: string]: MathItem;
  };
  order: Record<string, string[]>;
  activeItemId: string | undefined;
}

const getInitialState = (): MathItemsState => {
  const { items } = defaultScene;
  const mathScope = new MathScope({ parse: latexParser.parse });
  syncItemsToMathScope(mathScope, items);
  return {
    mathScope,
    items: keyBy(items, (item) => item.id),
    activeItemId: undefined,
    order: defaultScene.itemOrder,
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

const rawMathScope = (state: Draft<MathItemsState>) => {
  if (isDraft(state.mathScope)) {
    throw new Error("MathScope is not immerable");
  }
  return state.mathScope as MathScope;
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
      const activeFolderId = getActiveFolderId(state.order, state.activeItemId);
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

      syncItemsToMathScope(rawMathScope(state), [item]);
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

      removeItemsFromMathScope(rawMathScope(state), [item]);
    },
    setProperties: (
      state,
      action: PayloadAction<MathItemPatch<MathItemType>>
    ) => {
      const { id, properties: newProperties } = action.payload;
      const { properties: oldProperties } = state.items[id];
      state.items[id].properties = { ...oldProperties, ...newProperties };

      const item = state.items[id];
      syncItemsToMathScope(rawMathScope(state), [item]);
    },
  },
});

export type { MathItemsState };
export const { actions, reducer } = mathItemsSlice;
export default mathItemsSlice;
