import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CaseReducer } from "@reduxjs/toolkit";
import type { Reducer, UnknownAction } from "redux";
import { mathItemConfigs, MathItemType } from "@math3d/mathitem-configs";
import type { MathItem, MathItemPatch } from "@math3d/mathitem-configs";
import { keyBy } from "lodash-es";
import jsonPatch from "fast-json-patch";

import invariant from "tiny-invariant";
import { assertNotNil } from "@/util/predicates";
import IdGenerator from "@/util/idGenerator";
import {
  syncItemsToMathScope,
  removeItemsFromMathScope,
} from "./syncMathScope";
import type { SceneState } from "./interfaces";
import { makeMathScope } from "./mathScopeInstance";
import { isDescendantOf, MAIN_FOLDER, SETTINGS_FOLDER } from "./util";

const idGenerator = new IdGenerator({ initialValue: 100 });

const getInitialState = (): SceneState => {
  const mathScope = makeMathScope();
  return {
    key: null,
    dirty: false,
    author: null,
    mathScope: () => mathScope,
    items: {},
    activeItemId: undefined,
    activeTabId: MAIN_FOLDER,
    order: {},
    title: "Untitled",
  };
};

const getInsertionFolder = (
  order: SceneState["order"],
  itemId?: string,
): string => {
  if (itemId === undefined || isDescendantOf(order, itemId, SETTINGS_FOLDER)) {
    const folderId = order[MAIN_FOLDER].at(-1);
    assertNotNil(folderId, "Main folder should have at least one child.");
    return folderId;
  }
  /**
   * If the item exists on `order`, then it's a folder.
   */
  if (order[itemId]) return itemId;
  const folderEntry = Object.entries(order).find(([_folderId, itemIds]) => {
    return itemIds.includes(itemId);
  });
  assertNotNil(folderEntry, "Could not find active folder.");
  return folderEntry[0];
};
const getParent = (order: SceneState["order"], itemId: string): string => {
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

type SceneCaseReducer<P> = CaseReducer<SceneState, PayloadAction<P>>;
const withClean =
  (defaultClean: boolean = true) =>
  <P>(fn: SceneCaseReducer<P>) => {
    return {
      prepare: (payload: P, clean = defaultClean) => {
        return {
          payload,
          meta: { clean },
        };
      },
      reducer: fn,
    };
  };

const slice = createSlice({
  name: "scene",
  initialState: getInitialState,
  reducers: {
    setItems: withClean(true)<{
      items: MathItem[];
      order: SceneState["order"];
      title: SceneState["title"];
      author: SceneState["author"];
      key: SceneState["key"];
    }>((state, action) => {
      const { items, order, title, author, key } = action.payload;
      state.title = title;
      state.items = keyBy(items, (item) => item.id);
      state.order = order;
      state.activeItemId = undefined;
      state.activeTabId = MAIN_FOLDER;
      state.author = author;
      state.key = key;

      invariant(state.order[MAIN_FOLDER], "Main folder should exist.");
      invariant(state.order[SETTINGS_FOLDER], "Settings folder should exist.");

      const mathScope = makeMathScope();
      state.mathScope = () => mathScope;

      const ids = items
        .map((item) => +item.id)
        .filter((id) => !Number.isNaN(id));
      const maxId = Math.max(...ids);
      idGenerator.setCurrentValue(maxId > 0 ? maxId + 1 : 1);
      syncItemsToMathScope(mathScope, items);
    }),
    initializeMathScope: withClean(true)<void>((state) => {
      const items = Object.values(state.items);
      syncItemsToMathScope(state.mathScope(), items);
    }),
    addNewItem: (state, action: PayloadAction<{ type: MathItemType }>) => {
      const id = idGenerator.next();
      invariant(state.items[id] === undefined, "id should be unique");
      const { type } = action.payload;
      const item = mathItemConfigs[type].make(id);
      state.items[id] = item;
      state.activeTabId = MAIN_FOLDER;

      const isFolder = type === MathItemType.Folder;
      const activeFolderId = getInsertionFolder(
        state.order,
        state.activeItemId,
      );
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
        invariant(folder.type === MathItemType.Folder, "expected folder");
        folder.properties.isCollapsed = "false";
        syncItemsToMathScope(state.mathScope(), [folder]);
      }
      state.activeItemId = id;

      syncItemsToMathScope(state.mathScope(), [item]);
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      const item = state.items[id];
      delete state.items[id];

      const { order } = state;
      const parentFolderId = getParent(state.order, id);
      order[parentFolderId] = order[parentFolderId].filter(
        (itemId) => itemId !== id,
      );

      if (state.activeItemId === id) {
        state.activeItemId = undefined;
      }

      removeItemsFromMathScope(state.mathScope(), [item]);
    },
    setProperties: withClean(false)<MathItemPatch<MathItemType>>(
      (state, action) => {
        const { id, properties: newProperties } = action.payload;
        const { properties: oldProperties } = state.items[id];
        // @ts-expect-error TODO figure this out + reconisder the unions
        state.items[id].properties = { ...oldProperties, ...newProperties };

        const item = state.items[id];
        syncItemsToMathScope(state.mathScope(), [item]);
      },
    ),
    patchProperty: withClean(false)<{
      id: string;
      path: string;
      value: unknown;
    }>((state, action) => {
      const { id, path, value } = action.payload;

      const [result] = jsonPatch.applyPatch(
        state.items[id].properties,
        [{ op: "replace", path, value }],
        false, // skip validating the patch against JsonPatch spec
        true, // do mutate the object. (But not really, since it's a WriteableDraft)
      );
      invariant(
        result.removed !== undefined,
        "patch should have replaced and existing property.",
      );

      const item = state.items[id];
      syncItemsToMathScope(state.mathScope(), [item]);
    }),
    move: (
      state,
      action: PayloadAction<{
        id: string;
        newParent: string;
        newIndex: number;
      }>,
    ) => {
      const { id, newParent, newIndex } = action.payload;
      const oldParent = getParent(state.order, id);
      state.order[oldParent] = state.order[oldParent].filter((x) => x !== id);
      insertAtIndex(state.order[newParent], id, newIndex);
    },
    setTitle: (state, action: PayloadAction<{ title: string }>) => {
      const { title } = action.payload;
      state.title = title;
    },
    setActiveItem: withClean(true)<{ id: string }>((state, action) => {
      state.activeItemId = action.payload.id;
    }),
    setActiveTab: withClean(true)<{ id: string }>((state, action) => {
      state.activeTabId = action.payload.id;
    }),
    setClean: withClean(true)<void>((state, _action) => {
      state.dirty = false;
    }),
  },
});

const { actions } = slice;

type UnknownMaybeCleanAction = UnknownAction & { meta?: { clean?: boolean } };

const reducer: Reducer<SceneState, UnknownMaybeCleanAction> = (
  state,
  action,
) => {
  if (
    !state ||
    state.dirty ||
    !action.type.startsWith("scene/") ||
    action?.meta?.clean
  ) {
    return slice.reducer(state, action);
  }

  return slice.reducer({ ...state, dirty: true }, action);
};

const sceneSlice = { ...slice, reducer };

export type { SceneState };
export default sceneSlice;
export { actions, reducer };
