import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import {
  orderByOpacity,
  useDefaultGraphicOrder,
} from "./useDefaultGraphicOrder";

describe("orderByOpacity", () => {
  const treeOrder = { a: 0, b: 1, c: 2, d: 3 };

  test("draws more opaque graphics first, keeping tree order among equals", () => {
    expect(orderByOpacity(treeOrder, { a: 0.5, b: 1, c: 0.75, d: 1 })).toEqual({
      b: 0,
      d: 1,
      c: 2,
      a: 3,
    });
  });

  test("an opacity that didn't evaluate, or exceeds 1, counts as opaque", () => {
    expect(
      orderByOpacity(treeOrder, { a: 0.5, b: undefined, c: 2, d: 1 }),
    ).toEqual({ b: 0, c: 1, d: 2, a: 3 });
  });
});

describe("useDefaultGraphicOrder", () => {
  test("follows each graphic's evaluated opacity", async () => {
    const scene = new SceneBuilder();
    scene
      .folder()
      .explicitSurface({ opacity: "0.75" })
      .implicitSurface({ opacity: "1" });
    const store = getStore();
    store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
    const [translucent, opaque] = scene.items.filter(
      (item) =>
        item.type === MathItemType.ExplicitSurface ||
        item.type === MathItemType.ImplicitSurface,
    );
    const { result } = renderHook(() => useDefaultGraphicOrder(), {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    });

    // The tree order draws the lower surface first; opacity reverses that.
    await waitFor(() =>
      expect(result.current[opaque.id]).toBeLessThan(
        result.current[translucent.id],
      ),
    );

    act(() => {
      store.dispatch(
        actions.setProperties({
          id: opaque.id,
          type: opaque.type,
          properties: { opacity: "0.5" },
        }),
      );
    });
    await waitFor(() =>
      expect(result.current[opaque.id]).toBeGreaterThan(
        result.current[translucent.id],
      ),
    );
  });
});
