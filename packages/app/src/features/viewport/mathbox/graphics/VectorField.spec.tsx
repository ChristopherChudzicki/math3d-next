import React from "react";
import { render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import VectorField from "./VectorField";

const volumePropsFor = async (
  opts: Partial<MathItem<MIT.VectorField>["properties"]>,
) => {
  const scene = new SceneBuilder();
  scene.folder().vectorField(opts);
  const store = getStore();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  const item = scene.items.find(
    (x): x is MathItem<MIT.VectorField> => x.type === MIT.VectorField,
  );
  if (!item) throw new Error("expected a vector field");

  const { container } = render(
    <Provider store={store}>
      <VectorField item={item} />
    </Provider>,
  );

  // The mathbox-react mock exposes its props on the DOM node it renders, but
  // not its children, so read the Volume's props off the Group's children.
  // Every mocked component is the same, so find the Volume by its expr.
  // eslint-disable-next-line testing-library/no-node-access
  const group = container.firstChild as HTMLDivElement & {
    $props?: { children?: React.ReactNode };
  };
  const volumeProps = () =>
    // eslint-disable-next-line testing-library/no-node-access
    React.Children.toArray(group.$props?.children)
      .filter(React.isValidElement)
      .map((child) => child.props as Record<string, unknown>)
      .find((childProps) => "expr" in childProps);
  await waitFor(() => expect(volumeProps()?.depth).toBeDefined());
  return volumeProps();
};

test("a direction with one sample, after rounding, is centered; others span the range", async () => {
  const props = await volumePropsFor({
    samples1: "2",
    samples2: "1",
    samples3: "1.3",
  });
  expect(props).toMatchObject({
    centeredX: false,
    centeredY: true,
    centeredZ: true,
  });
});
