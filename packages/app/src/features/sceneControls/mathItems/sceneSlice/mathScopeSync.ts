import type { Middleware } from "@reduxjs/toolkit";
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
  /**
   * Called when `get()` starts returning a different MathScope, which happens
   * once per `setScene`. Compatible with `useSyncExternalStore`.
   */
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
 * Reducers keep items immutable, so an item whose reference changed is exactly
 * an item that was edited. Each `setScene` gets a fresh MathScope, so evaluated
 * results from the previous scene never leak into components that stay mounted.
 */
const createMathScopeSync = () => {
  let scope = makeMathScope();
  const listeners = new Set<() => void>();

  const middleware: Middleware<object, { scene: SceneState }> = (api) => {
    syncItemsToMathScope(scope, Object.values(api.getState().scene.items));
    return (next) => (action) => {
      const prev = api.getState().scene.items;
      const result = next(action);
      const { items } = api.getState().scene;
      if (actions.setScene.match(action)) {
        scope = makeMathScope();
        syncItemsToMathScope(scope, Object.values(items));
        listeners.forEach((listener) => listener());
      } else if (items !== prev) {
        syncChangedItems(scope, prev, items);
      }
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
