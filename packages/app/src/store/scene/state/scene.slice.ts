import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import type { CaseReducer } from "@reduxjs/toolkit";
import type { Reducer, UnknownAction } from "redux";
import {
  isMathGraphic,
  mathItemConfigs,
  MathItemType,
} from "@math3d/mathitem-configs";
import type {
  MathGraphic,
  MathItem,
  MathItemPatch,
} from "@math3d/mathitem-configs";
import { keyBy } from "lodash-es";
import jsonPatch from "fast-json-patch";

import invariant from "tiny-invariant";
import { assertNotNil } from "@/util/predicates";
import { sceneFingerprint } from "@/store/scene/drafts/fingerprint";
import type { SceneContent } from "@/store/scene/drafts/fingerprint";
import type { SceneState } from "./interfaces";
import {
  hasCalculatedVisibility,
  isDescendantOf,
  MAIN_FOLDER,
  SETTINGS_FOLDER,
} from "./util";

const getInitialState = (): SceneState => ({
  key: null,
  loaded: false,
  dirty: false,
  revision: 0,
  loadCount: 0,
  author: null,
  items: {},
  nextItemId: 1,
  isLegacy: false,
  activeItemId: undefined,
  activeTabId: MAIN_FOLDER,
  order: {},
  title: "",
  draftId: nanoid(),
  baseline: "",
  modifiedDate: null,
  savedSince: false,
});

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

type SetScenePayload = {
  items: MathItem[];
  order: SceneState["order"];
  title: SceneState["title"];
  isLegacy: SceneState["isLegacy"];
  author: SceneState["author"];
  key: SceneState["key"];
  modifiedDate?: SceneState["modifiedDate"];
  /** Continues a session's draft; omitted, the load starts a new session. */
  draftId?: string;
  /** An opened draft is unsaved work from the start. */
  dirty?: boolean;
  savedSince?: boolean;
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
    setScene: {
      // The draft id is minted here, not in the reducer, to keep it pure.
      prepare: (payload: SetScenePayload) => ({
        payload: { ...payload, draftId: payload.draftId ?? nanoid() },
        meta: { clean: true },
      }),
      reducer: (
        state,
        action: PayloadAction<
          SetScenePayload & { draftId: string },
          string,
          { clean: boolean }
        >,
      ) => {
        const { items, order, title, author, key, isLegacy } = action.payload;
        state.title = title;
        state.items = keyBy(items, (item) => item.id);
        state.order = order;
        state.activeItemId = undefined;
        state.activeTabId = MAIN_FOLDER;
        state.author = author;
        state.key = key;
        state.loaded = true;
        state.loadCount += 1;
        state.dirty = action.payload.dirty ?? false;
        state.isLegacy = isLegacy;
        state.draftId = action.payload.draftId;
        state.baseline = sceneFingerprint({ title, items, itemOrder: order });
        state.modifiedDate = action.payload.modifiedDate ?? null;
        state.savedSince = action.payload.savedSince ?? false;

        invariant(state.order[MAIN_FOLDER], "Main folder should exist.");
        invariant(
          state.order[SETTINGS_FOLDER],
          "Settings folder should exist.",
        );

        const ids = items
          .map((item) => +item.id)
          .filter((id) => !Number.isNaN(id));
        const maxId = Math.max(...ids);
        state.nextItemId = maxId > 0 ? maxId + 1 : 1;
      },
    },
    addNewItem: (state, action: PayloadAction<{ type: MathItemType }>) => {
      const id = `${state.nextItemId}`;
      state.nextItemId += 1;
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
      }
      state.activeItemId = id;
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      delete state.items[id];

      const { order } = state;
      const parentFolderId = getParent(state.order, id);
      order[parentFolderId] = order[parentFolderId].filter(
        (itemId) => itemId !== id,
      );

      if (state.activeItemId === id) {
        state.activeItemId = undefined;
      }
    },
    setProperties: withClean(false)<MathItemPatch<MathItemType>>(
      (state, action) => {
        const { id, properties: newProperties } = action.payload;
        const item = state.items[id];
        const { properties: oldProperties } = item;
        // @ts-expect-error TODO figure this out + reconisder the unions
        item.properties = { ...oldProperties, ...newProperties };
        // Editing the expression puts it in charge; clearing it hands
        // visibility back to `visible`.
        if (
          isMathGraphic(item) &&
          "calculatedVisibility" in newProperties &&
          newProperties.calculatedVisibility !==
            (oldProperties as MathGraphic["properties"]).calculatedVisibility
        ) {
          item.properties.useCalculatedVisibility = hasCalculatedVisibility(
            item.properties,
          );
        }
      },
    ),
    /** Hands visibility back to each item's Calculated Visibility, if it has one. */
    followCalculatedVisibility: withClean(false)<{ ids: string[] }>(
      (state, action) => {
        action.payload.ids.forEach((id) => {
          const item = state.items[id];
          if (
            item &&
            isMathGraphic(item) &&
            hasCalculatedVisibility(item.properties)
          ) {
            item.properties.useCalculatedVisibility = true;
          }
        });
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
    markSaved: withClean(true)<{
      key: string;
      author: SceneState["author"];
      /** Omitted by an in-place save, which must not revert a title typed since. */
      title?: string;
      isLegacy?: boolean;
      revision: number;
      loadCount: number;
      /** The content that was sent. */
      snapshot: SceneContent;
      modifiedDate: string;
    }>((state, action) => {
      const { key, author, title, isLegacy, revision, loadCount } =
        action.payload;
      // The user moved on to another scene while the save was in flight.
      if (state.loadCount !== loadCount) return;
      state.key = key;
      state.author = author;
      state.loaded = true;
      if (title !== undefined) state.title = title;
      if (isLegacy !== undefined) state.isLegacy = isLegacy;
      if (state.revision === revision) state.dirty = false;
      state.baseline = sceneFingerprint(action.payload.snapshot);
      state.modifiedDate = action.payload.modifiedDate;
      state.savedSince = false;
    }),
  },
});

const { actions } = slice;

type UnknownMaybeCleanAction = UnknownAction & { meta?: { clean?: boolean } };

const reducer: Reducer<SceneState, UnknownMaybeCleanAction> = (
  state,
  action,
) => {
  if (!state || !action.type.startsWith("scene/") || action?.meta?.clean) {
    return slice.reducer(state, action);
  }

  return slice.reducer(
    { ...state, dirty: true, revision: state.revision + 1 },
    action,
  );
};

const sceneSlice = { ...slice, reducer };

export type { SceneState, SetScenePayload };
export default sceneSlice;
export { actions, reducer };
