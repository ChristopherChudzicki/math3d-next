import type { Middleware } from "@reduxjs/toolkit";
import { isMathGraphic } from "@math3d/mathitem-configs";
import type { SceneState } from "@/store/scene/state/interfaces";
import { actions } from "@/store/scene/state/scene.slice";
import { visibilityMode } from "@/store/scene/state/util";
import type { MathScopeSource } from "./mathScopeSync";
import { mathScopeId } from "./mathScope";

type Items = SceneState["items"];

/**
 * Each graphic's last error-free Calculated Visibility, carried over while it
 * errors, and the ids of manual items whose value differs from `previous`.
 */
const readValues = (
  source: MathScopeSource,
  items: Items,
  previous: Map<string, unknown>,
) => {
  const { results } = source.get();
  const values = new Map<string, unknown>();
  const changed: string[] = [];
  Object.values(items).forEach((item) => {
    if (!isMathGraphic(item)) return;
    const id = mathScopeId(item.id, "calculatedVisibility");
    if (!results.has(id)) {
      if (previous.has(item.id)) values.set(item.id, previous.get(item.id));
      return;
    }
    const value = results.get(id);
    values.set(item.id, value);
    if (
      previous.has(item.id) &&
      !Object.is(previous.get(item.id), value) &&
      visibilityMode(item.properties) === "manual"
    ) {
      changed.push(item.id);
    }
  });
  return { values, changed };
};

/**
 * Hands a manually set item back to its Calculated Visibility when the
 * expression's value changes. Errors don't count, so a variable retyped through
 * a parse error relinks only if the value it settles on differs.
 */
const createCalculatedVisibilityRelink = (
  source: MathScopeSource,
): Middleware<object, { scene: SceneState }> => {
  let synced: Items | undefined;
  let values = new Map<string, unknown>();
  return (api) => (next) => (action) => {
    if (synced === undefined) {
      synced = api.getState().scene.items;
      values = readValues(source, synced, new Map()).values;
    }
    const result = next(action);
    const { items } = api.getState().scene;
    if (items === synced) return result;
    synced = items;
    // A new scene's values aren't changes.
    const previous = actions.setScene.match(action) ? new Map() : values;
    const read = readValues(source, items, previous);
    values = read.values;
    if (read.changed.length > 0) {
      // The triggering action already decided whether the scene is dirty.
      api.dispatch(
        actions.followCalculatedVisibility({ ids: read.changed }, true),
      );
    }
    return result;
  };
};

export { createCalculatedVisibilityRelink };
