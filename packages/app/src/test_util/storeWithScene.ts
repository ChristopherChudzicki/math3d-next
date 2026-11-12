import type { SceneBuilder } from "@math3d/mock-api";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";

export type SceneInput = Pick<
  SceneBuilder,
  "items" | "itemOrder" | "title" | "key" | "isLegacy" | "author"
>;

/** A fresh store with `scene` loaded and evaluated. */
export const storeWithScene = (scene: SceneInput) => {
  const store = getStore();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  return store;
};
