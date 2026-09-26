import type { Middleware } from "@reduxjs/toolkit";
import { restoreStore } from "@/store/restoreStore";
import type { SceneState, AppMathScope } from "./interfaces";
import { actions } from "./scene.slice";
import { makeMathScope } from "./mathScopeInstance";
import {
  syncItemsToMathScope,
  removeItemsFromMathScope,
} from "./syncMathScope";

type Items = SceneState["items"];

interface MathScopeSource {
  get: () => AppMathScope;
  /** `listener` fires whenever `get()` would return a new MathScope. */
  subscribe: (listener: () => void) => () => void;
}

const syncChangedItems = (scope: AppMathScope, prev: Items, next: Items) => {
  const removed = Object.values(prev).filter((item) => !next[item.id]);
  const changed = Object.values(next).filter((item) => prev[item.id] !== item);
  if (removed.length > 0) removeItemsFromMathScope(scope, removed);
  if (changed.length > 0) syncItemsToMathScope(scope, changed);
};

/**
 * Keeps a MathScope in sync with `scene.items`, outside of Redux state.
 *
 * Immer gives every edited item a new reference, so re-syncing items whose
 * reference changed covers every edit.
 *
 * Each `setScene` or `restoreStore` needs a fresh MathScope: item ids recur
 * across scenes, and a reused scope would keep the old scene's expressions and
 * results for them.
 */
const createMathScopeSync = () => {
  let scope = makeMathScope();
  let synced: Items = {};
  const listeners = new Set<() => void>();

  const middleware: Middleware<object, { scene: SceneState }> = (api) => {
    synced = api.getState().scene.items;
    syncItemsToMathScope(scope, Object.values(synced));
    return (next) => (action) => {
      const result = next(action);
      const { items } = api.getState().scene;
      if (actions.setScene.match(action) || restoreStore.match(action)) {
        scope = makeMathScope();
        syncItemsToMathScope(scope, Object.values(items));
        listeners.forEach((listener) => listener());
      } else if (items !== synced) {
        syncChangedItems(scope, synced, items);
      }
      synced = items;
      return result;
    };
  };

  const source: MathScopeSource = {
    get: () => scope,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return { middleware, source };
};

export { createMathScopeSync };
export type { MathScopeSource };
