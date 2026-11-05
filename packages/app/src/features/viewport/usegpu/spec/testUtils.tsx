import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import type { Scene } from "@math3d/api";
import { isMathGraphic } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { getStore } from "@/store/store";
import { useAppSelector } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { SpecCollector } from "./collector";
import { GraphicSpecReporter } from "./reporter";
import type { GraphicSpec } from "./types";

const Harness: React.FC<{ id: string }> = ({ id }) => {
  const item = useAppSelector((state) => state.scene.items[id]);
  invariant(isMathGraphic(item), `${id} is not a graphic`);
  return <GraphicSpecReporter item={item} />;
};

/**
 * The spec item `id` reports once `scene` is loaded. Results reach the spec
 * components in effects, which `render` flushes, so the last report is the
 * settled one.
 */
export const renderSpec = (
  scene: Pick<Scene, "items" | "itemOrder">,
  id: string,
): GraphicSpec | null => {
  const store = getStore();
  store.dispatch(
    actions.setScene({
      items: scene.items,
      order: scene.itemOrder,
      title: "",
      isLegacy: false,
      author: null,
      key: null,
    }),
  );
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
