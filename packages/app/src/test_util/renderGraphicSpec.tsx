import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import type { SceneBuilder } from "@math3d/mock-api";
import { isMathGraphic } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { getStore } from "@/store/store";
import { useAppSelector } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { SpecCollector } from "@/features/viewport/usegpu/graphicSpec/collector";
import { GraphicSpecReporter } from "@/features/viewport/usegpu/graphicSpec/reporter";
import type { GraphicSpec } from "@/features/viewport/usegpu/graphicSpec/types";

const Harness: React.FC<{ id: string }> = ({ id }) => {
  const item = useAppSelector((state) => state.scene.items[id]);
  invariant(isMathGraphic(item), `${id} is not a graphic`);
  return <GraphicSpecReporter item={item} />;
};

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

/**
 * The spec item `id` reports once `scene` is loaded. Results reach the spec
 * components in effects, which `render` flushes, so the last report is the
 * settled one.
 */
export const renderGraphicSpec = (
  scene: SceneInput,
  id: string,
): GraphicSpec | null => {
  const store = storeWithScene(scene);
  const collector = vi.fn<(id: string, spec: GraphicSpec | null) => void>();
  render(
    <Provider store={store}>
      <SpecCollector.Provider value={collector}>
        <Harness id={id} />
      </SpecCollector.Provider>
    </Provider>,
  );
  return collector.mock.lastCall?.[1] ?? null;
};
