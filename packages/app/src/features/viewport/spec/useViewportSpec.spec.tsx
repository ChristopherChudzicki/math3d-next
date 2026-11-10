import React from "react";
import { act, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import type { ViewportSpec } from "@math3d/viewport-spec";
import { storeWithScene } from "@/test_util/renderGraphicSpec";
import { actions } from "@/store/scene/state/scene.slice";
import { useViewportSpec } from "./useViewportSpec";

const renderViewportSpec = (scene: SceneBuilder) => {
  const store = storeWithScene(scene);
  const latest: { spec?: ViewportSpec } = {};
  const Harness = () => {
    const viewport = useViewportSpec();
    latest.spec = viewport.spec;
    return viewport.reporters;
  };
  const ui = () => (
    <Provider store={store}>
      <Harness />
    </Provider>
  );
  const view = render(ui());
  return { store, latest, rerender: () => view.rerender(ui()) };
};

test("lists drawable graphics in item order, including one that becomes visible later", () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.point({}, "p");
  folder.point({ visible: false }, "q");
  folder.point({}, "r");
  const { store, latest } = renderViewportSpec(scene);
  const points = () =>
    latest.spec?.graphics
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

test("keeps its identity across rerenders", () => {
  const { latest, rerender } = renderViewportSpec(new SceneBuilder());
  const before = latest.spec;
  rerender();
  expect(latest.spec).toBe(before);
});
