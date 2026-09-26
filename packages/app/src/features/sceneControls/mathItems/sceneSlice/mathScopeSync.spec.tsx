import React, { act } from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import { restoreStore } from "@/store/restoreStore";
import type { AppStore } from "@/store/store";
import { actions } from "./scene.slice";
import { useMathScope } from "./hooks";

const loadScene = (store: AppStore, scene: SceneBuilder) => {
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
};

const sceneWithVariable = () => {
  const scene = new SceneBuilder();
  scene.folder().variable();
  const variable = scene.items.find((item) => item.type === MIT.Variable);
  if (!variable) throw new Error("expected a variable");
  return { scene, valueId: `${variable.id}-value` };
};

const restore = (store: AppStore) => {
  const preloadedState = JSON.parse(JSON.stringify(store.getState()));
  return { preloadedState, restored: getStore({ preloadedState }) };
};

test("useMathScope follows the fresh MathScope that setScene swaps in", () => {
  const store = getStore();
  const first = sceneWithVariable();
  loadScene(store, first.scene);
  const firstScope = store.mathScope.get();
  const { result } = renderHook(() => useMathScope(), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });

  act(() => loadScene(store, new SceneBuilder()));

  expect(result.current).toBe(store.mathScope.get());
  expect(result.current).not.toBe(firstScope);
  expect(result.current.results.has(first.valueId)).toBe(false);
});

test("a store restored from JSON evaluates its items", () => {
  const store = getStore();
  const { scene, valueId } = sceneWithVariable();
  loadScene(store, scene);

  const { restored } = restore(store);

  expect(restored.mathScope.get().results.has(valueId)).toBe(true);
});

test("a store restored from JSON continues its own item ids", () => {
  const store = getStore();
  loadScene(store, sceneWithVariable().scene);
  const { preloadedState, restored } = restore(store);

  store.dispatch(actions.addNewItem({ type: MIT.Point }));
  restored.dispatch(actions.addNewItem({ type: MIT.Point }));

  expect(restored.getState().scene.items).toHaveProperty(
    `${preloadedState.scene.nextItemId}`,
  );
});

test("restoreStore replaces the whole store and evaluates it in a fresh MathScope", () => {
  const source = getStore();
  const { scene, valueId } = sceneWithVariable();
  loadScene(source, scene);
  const saved = JSON.parse(JSON.stringify(source.getState()));
  const store = getStore();
  const before = store.mathScope.get();

  store.dispatch(restoreStore(saved));

  expect(store.getState()).toEqual(saved);
  expect(store.mathScope.get()).not.toBe(before);
  expect(store.mathScope.get().results.has(valueId)).toBe(true);
});
