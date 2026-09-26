import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import type { AppStore } from "@/store/store";
import { actions } from "./scene.slice";

const loadScene = (store: AppStore, scene: SceneBuilder) => {
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
};

const sceneWithVariable = (rhs: string) => {
  const scene = new SceneBuilder();
  scene.folder().variable({ value: { lhs: "a", rhs, type: "assignment" } });
  const variable = scene.items.find((item) => item.type === MIT.Variable);
  if (!variable) throw new Error("expected a variable");
  return { scene, valueId: `${variable.id}-value`, id: variable.id };
};

test("editing an item re-evaluates its expressions", () => {
  const store = getStore();
  const { scene, id, valueId } = sceneWithVariable("1");
  loadScene(store, scene);

  store.dispatch(
    actions.setProperties({
      id,
      type: MIT.Variable,
      properties: { value: { lhs: "a", rhs: "2", type: "assignment" } },
    }),
  );

  expect(store.mathScope.get().results.get(valueId)).toBe(2);
});

test("removing an item removes its expressions", () => {
  const store = getStore();
  const { scene, id, valueId } = sceneWithVariable("1");
  loadScene(store, scene);

  store.dispatch(actions.remove({ id }));

  expect(store.mathScope.get().results.has(valueId)).toBe(false);
});

test("setScene swaps in a fresh MathScope and notifies subscribers", () => {
  const store = getStore();
  const first = sceneWithVariable("1");
  loadScene(store, first.scene);
  const firstScope = store.mathScope.get();
  const listener = vi.fn();
  store.mathScope.subscribe(listener);

  loadScene(store, new SceneBuilder());

  expect(listener).toHaveBeenCalledOnce();
  expect(store.mathScope.get()).not.toBe(firstScope);
  expect(store.mathScope.get().results.has(first.valueId)).toBe(false);
});

test("a store restored from JSON evaluates its items and continues item ids", () => {
  const store = getStore();
  const { scene, valueId } = sceneWithVariable("1");
  loadScene(store, scene);
  const serialized = JSON.stringify(store.getState());

  const restored = getStore({ preloadedState: JSON.parse(serialized) });

  expect(restored.getState()).toEqual(store.getState());
  expect(restored.mathScope.get().results.get(valueId)).toBe(1);

  const expectedId = `${store.getState().scene.nextItemId}`;
  restored.dispatch(actions.addNewItem({ type: MIT.Point }));
  expect(restored.getState().scene.activeItemId).toBe(expectedId);
});
