import React from "react";
import { act, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import type { ViewportSpec } from "@math3d/viewport-spec";
import { storeWithScene } from "@/test_util/renderGraphicSpec";
import { actions } from "@/store/scene/state/scene.slice";
import { useViewportSpec } from "./useViewportSpec";

test("lists the graphics with something to draw in item order, whenever each starts drawing", () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.point({}, "p");
  folder.point({ visible: false }, "q");
  folder.point({}, "r");
  const store = storeWithScene(scene);
  let spec: ViewportSpec | undefined;
  const Harness = () => {
    const viewport = useViewportSpec();
    spec = viewport.spec;
    return viewport.reporters;
  };
  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
  const points = () =>
    spec?.graphics
      .map(({ id }) => id)
      .filter((id) => ["p", "q", "r"].includes(id));
  expect(points()).toEqual(["p", "r"]);

  act(() => {
    store.dispatch(
      actions.patchProperty({ id: "q", path: "/visible", value: true }),
    );
  });
  expect(points()).toEqual(["p", "q", "r"]);
});
