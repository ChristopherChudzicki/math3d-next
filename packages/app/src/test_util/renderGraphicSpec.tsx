import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { isMathGraphic } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { useAppSelector } from "@/store/hooks";
import { SpecCollector } from "@/features/viewport/spec/collector";
import { GraphicSpecReporter } from "@/features/viewport/spec/reporter";
import type { GraphicSpec } from "@math3d/viewport-spec";
import { storeWithScene } from "./storeWithScene";
import type { SceneInput } from "./storeWithScene";

const Harness: React.FC<{ id: string }> = ({ id }) => {
  const item = useAppSelector((state) => state.scene.items[id]);
  invariant(isMathGraphic(item), `${id} is not a graphic`);
  return <GraphicSpecReporter item={item} />;
};

/**
 * The spec each of `ids` reports once `scene` is loaded, keyed by id; an id
 * that never reports is absent. Results reach the spec components in effects,
 * which `render` flushes, so each item's last report is the settled one.
 */
export const collectGraphicSpecs = (
  scene: SceneInput,
  ids: string[],
): Partial<Record<string, GraphicSpec | null>> => {
  const store = storeWithScene(scene);
  const specs: Partial<Record<string, GraphicSpec | null>> = {};
  const collect = (id: string, spec: GraphicSpec | null) => {
    specs[id] = spec;
  };
  render(
    <Provider store={store}>
      <SpecCollector.Provider value={collect}>
        {ids.map((id) => (
          <Harness key={id} id={id} />
        ))}
      </SpecCollector.Provider>
    </Provider>,
  );
  // A copy: unmounting at cleanup reports null into `specs`.
  return { ...specs };
};

/** The spec item `id` reports once `scene` is loaded. */
export const renderGraphicSpec = (
  scene: SceneInput,
  id: string,
): GraphicSpec | null => collectGraphicSpecs(scene, [id])[id] ?? null;
