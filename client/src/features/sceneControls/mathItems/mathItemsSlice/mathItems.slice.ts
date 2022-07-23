import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { mathItemConfigs, MathItemType } from "configs";
import type { MathItem, MathItemPatch } from "configs";
import { keyBy } from "lodash";
import { assertIsMathItemType, assertNotNil } from "util/predicates";
import MathScope from "util/MathScope";

import { latexParser } from "util/parsing";
import defaultScene from "../../defaultScene";
import {
  syncItemsToMathScope,
  removeItemsFromMathScope,
} from "./syncMathScope";

interface MathItemsState {
  items: {
    [id: string]: MathItem;
  };
  order: Record<string, string[]>;
  activeItemId: string | undefined;
  /**
   * We need to sync the expressions in MathItem.properties with the MathScope.
   * Putting mathScope in the redux store is a very convenient way to do this
   * since actions are the centralized place for editing MathItem properties.
   *
   * This is a nonserializable value, so comes with some caveats. See
   * https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
   */
  mathScope: () => MathScope;
}

const getInitialState = (): MathItemsState => {
  const mathScope = new MathScope({ parse: latexParser.parse });
  return {
    mathScope: () => mathScope,
    items: keyBy(defaultScene.items, (item) => item.id),
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

const mathItemsSlice = createSlice({
  name: "mathItems",
  initialState: getInitialState,
  reducers: {
    addItems: (_state, _action: PayloadAction<{ items: MathItem[] }>) => {
      throw new Error("Not implemented");
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
      const insertAfterIndex = folderItems.findIndex(
        (itemId) => itemId === insertAfterId
      );
      const insertionIndex =
        insertAfterIndex < 0 ? folderItems.length : insertAfterIndex + 1;
      state.order[targetFolderId].splice(insertionIndex, 0, id);
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
  },
});

export type { MathItemsState };
export const { actions, reducer } = mathItemsSlice;
export default mathItemsSlice;
