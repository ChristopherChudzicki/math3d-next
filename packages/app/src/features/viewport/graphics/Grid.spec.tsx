import React from "react";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import Grid from "./Grid";

test("an empty zIndex reaches MathBox unset, so it takes MathBox's default", async () => {
  // An empty zIndex fails validation, which the evaluator warns about.
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const scene = new SceneBuilder().grid("xy", { zIndex: "" });
  const store = getStore();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  const item = scene.items.find(
    (x): x is MathItem<MIT.Grid> =>
      x.type === MIT.Grid && x.properties.axes === "xy",
  );
  if (!item) throw new Error("expected the xy grid");

  const { container } = render(
    <Provider store={store}>
      <Grid item={item} />
    </Provider>,
  );

  // The mathbox-react mock exposes its props on the DOM node it renders.
  // eslint-disable-next-line testing-library/no-node-access
  const node = container.firstChild as HTMLDivElement & {
    $props?: Record<string, unknown>;
  };
  await waitFor(() => expect(node.$props).toHaveProperty("axes", "xy"));
  expect(node.$props?.zIndex).toBeUndefined();
  expect(warn).toHaveBeenCalled();
});
