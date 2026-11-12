import React from "react";
import { act, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import type { ViewportSpec } from "@math3d/viewport-spec";
import { storeWithScene } from "@/test_util/storeWithScene";
import { actions } from "@/store/scene/state/scene.slice";
import { useViewportSpec } from "./useViewportSpec";

const renderViewportSpec = (scene: SceneBuilder) => {
  const store = storeWithScene(scene);
  const latest: { spec?: ViewportSpec } = {};
  const Harness = () => {
    const viewport = useViewportSpec({ current: null });
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

const ids = (spec: ViewportSpec | undefined, among: string[]) =>
  spec?.graphics.map(({ id }) => id).filter((id) => among.includes(id));

test("lists drawable graphics, including one that becomes visible later", () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.point({}, "p");
  folder.point({ visible: false }, "q");
  folder.point({}, "r");
  const { store, latest } = renderViewportSpec(scene);
  const points = () => ids(latest.spec, ["p", "q", "r"]);
  expect(points()).toEqual(["r", "p"]);

  act(() => {
    store.dispatch(
      actions.patchProperty({ id: "q", path: "/visible", value: true }),
    );
  });
  expect(points()).toEqual(["r", "q", "p"]);
});

test("lists graphics in MathBox's draw order: by zOrder, by default opaque first, then up the tree", async () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  // Tree order alone would draw these bottom to top.
  folder.point({ zOrder: "-1" }, "first");
  folder.point({}, "upper");
  folder.point({}, "lower");
  folder.point({ opacity: "0.5" }, "translucent");
  const { latest } = renderViewportSpec(scene);
  await waitFor(() =>
    expect(
      ids(latest.spec, ["translucent", "upper", "lower", "first"]),
    ).toEqual(["first", "lower", "upper", "translucent"]),
  );
});

test("a new zOrder reorders the graphics; one that only moved keeps its spec", async () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.point({}, "p");
  folder.point({}, "q");
  const { store, latest } = renderViewportSpec(scene);
  const points = () =>
    (latest.spec?.graphics ?? []).filter(({ id }) => ["p", "q"].includes(id));
  const [q, p] = points();
  expect([q.id, p.id]).toEqual(["q", "p"]);

  act(() => {
    store.dispatch(
      actions.patchProperty({ id: "q", path: "/zOrder", value: "9" }),
    );
  });
  await waitFor(() => expect(points()[1].id).toBe("q"));
  expect(points()[0].spec).toBe(p.spec);
});

test("keeps its identity across rerenders", () => {
  const { latest, rerender } = renderViewportSpec(new SceneBuilder());
  const before = latest.spec;
  rerender();
  expect(latest.spec).toBe(before);
});
