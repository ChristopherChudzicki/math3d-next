import { createSelector } from "@reduxjs/toolkit";
import type { SelectorReturn, RootState } from "@/store/store";
import type { MathGraphic, MathItem } from "@math3d/mathitem-configs";
import { isMathGraphic, isSurface } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { shallowEqual } from "react-redux";
import type { SceneState, AppMathScope, Subtree } from "./interfaces";
import * as utils from "./util";
import { SETTINGS_FOLDER } from "./util";

const title: SelectorReturn<SceneState["title"]> = (state: RootState) =>
  state.scene.title;

const author: SelectorReturn<SceneState["author"]> = (state: RootState) =>
  state.scene.author;

const mathItems: SelectorReturn<SceneState["items"]> = (state: RootState) =>
  state.scene.items;

const stableOrderedMathItems: SelectorReturn<MathItem[]> = createSelector(
  [mathItems],
  (items) => Object.values(items).sort((a, b) => a.id.localeCompare(b.id)),
);
const mathGraphics: SelectorReturn<MathGraphic[]> = createSelector(
  [mathItems],
  (items) =>
    Object.values(items)
      .sort((a, b) => a.id.localeCompare(b.id))
      .filter(isMathGraphic),
);

const mathItem =
  (id: string): SelectorReturn<MathItem> =>
  (state: RootState) =>
    state.scene.items[id];

const getSubtree = (
  order: SceneState["order"],
  node: Subtree,
  depth = 0,
): Subtree => {
  if (node.children) return node;
  if (!order[node.id]) return node;
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
  const children = order[node.id].map((id) => {
    return getSubtree(order, { id, parent: null }, depth + 1);
  });
  const nodeWithChildren = { ...node, children };
  children.forEach((child) => {
    // eslint-disable-next-line no-param-reassign
    child.parent = nodeWithChildren;
  });
  return nodeWithChildren;
};

const subtree = createSelector(
  [
    (state: RootState) => state.scene.order,
    (_state: RootState, rootId: string) => rootId,
  ],
  (order, rootId) => getSubtree(order, { id: rootId, parent: null }),
);

const isActive =
  (id: string): SelectorReturn<boolean> =>
  (state: RootState) =>
    state.scene.activeItemId === id;

const mathScope = (): SelectorReturn<AppMathScope> => (state: RootState) =>
  state.scene.mathScope();

const isPermanent =
  (id: string): SelectorReturn<boolean> =>
  (state: RootState) => {
    if (id === SETTINGS_FOLDER) return true;
    const { order } = state.scene;
    return utils.isDescendantOf(order, id, SETTINGS_FOLDER);
  };

const hasChildren =
  (id: string): SelectorReturn<boolean> =>
  (state: RootState) => {
    const { order } = state.scene;
    return order[id]?.length > 0;
  };

const getItems = createSelector(
  [mathItems, (_state: RootState, ids: string[]) => ids],
  (items, ids) =>
    ids.map((id) => {
      invariant(items[id], `MathItem with id ${id} not found.`);
      return items[id];
    }),
);

const hasItems =
  (ids: string[]): SelectorReturn<boolean> =>
  (state: RootState) => {
    const { items } = state.scene;
    return ids.every((id) => items[id]);
  };

const key = (state: RootState) => state.scene.key;

const dirty = (state: RootState) => state.scene.dirty;

const itemOrder = (state: RootState) => state.scene.order;

const isLegacy = (state: RootState) => state.scene.isLegacy;

const defaultGraphicOrder: SelectorReturn<Record<string, number>> =
  createSelector(
    [mathItems, itemOrder],
    (items, itemOrderDict) => {
      const { main, setup } = itemOrderDict;
      if (!main || !setup) {
        return {};
      }
      invariant(main, "Main item order not found.");
      invariant(setup, "Setup item order not found.");
      const graphics = [...main, ...setup].flatMap((folderId) => {
        const itemIds = itemOrderDict[folderId];
        invariant(itemIds, `Item order for ${folderId} not found.`);
        return itemIds.map((id) => items[id]).filter(isMathGraphic);
      });
      const reversed = [...graphics].reverse();
      const ordered = reversed.sort((a, b) => {
        if (isSurface(a) && isSurface(b)) {
          return 0;
        }
        if (isSurface(a)) {
          return 1; // draw surfaces last
        }
        if (isSurface(b)) {
          return -1; // draw surfaces last
        }
        return 0;
      });
      const orders = Object.fromEntries(
        ordered.map((item, index) => {
          return [item.id, index];
        }),
      );
      return orders;
    },
    {
      memoizeOptions: {
        resultEqualityCheck: shallowEqual,
      },
    },
  );

const sceneInfo = createSelector(
  [title, author, stableOrderedMathItems, itemOrder, key],
  (sceneTitle, sceneAuthor, items, order, sceneKey) => ({
    title: sceneTitle,
    author: sceneAuthor,
    items,
    itemOrder: order,
    key: sceneKey,
  }),
);

export {
  title,
  subtree,
  isActive,
  mathItems,
  mathItem,
  mathScope,
  stableOrderedMathItems,
  mathGraphics,
  defaultGraphicOrder,
  hasItems,
  getItems,
  sceneInfo,
  isPermanent,
  isLegacy,
  hasChildren,
  dirty,
};
export type { Subtree };
