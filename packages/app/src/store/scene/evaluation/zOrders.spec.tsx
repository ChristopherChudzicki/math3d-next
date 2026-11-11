import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { orderByOpacity, useDefaultZOrder, useZOrders } from "./zOrders";

describe("orderByOpacity", () => {
  // Keys out of tree order, so that only the tiebreak keeps tree order.
  const treeOrder = { d: 3, c: 2, b: 1, a: 0 };

  test("draws more opaque graphics first, keeping tree order among equals", () => {
    const opacities = new Map([
      ["a", 0.5],
      ["b", 1],
      ["c", 0.75],
      ["d", 1],
    ]);
    expect(orderByOpacity(treeOrder, (id) => opacities.get(id))).toEqual({
      b: 0,
      d: 1,
      c: 2,
      a: 3,
    });
  });

  test("an opacity that never evaluated, or exceeds 1, counts as opaque", () => {
    const opacities = new Map([
      ["a", 0.5],
      ["c", 2],
      ["d", 1],
    ]);
    expect(orderByOpacity(treeOrder, (id) => opacities.get(id))).toEqual({
      b: 0,
      c: 1,
      d: 2,
      a: 3,
    });
  });
});

describe("useDefaultZOrder", () => {
  const setup = () => {
    const scene = new SceneBuilder();
    scene
      .folder()
      .variable({ value: { type: "assignment", lhs: "a", rhs: "1" } }, "a")
      // Above "translucent", so tree order alone would draw it later.
      .explicitSurface({ opacity: "a" }, "varying")
      .explicitSurface({}, "translucent");
    const store = getStore();
    store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
    const { result } = renderHook(
      // NaN fails every comparison, so an unset zOrder fails the test.
      () => ({
        translucent: useDefaultZOrder("translucent") ?? NaN,
        varying: useDefaultZOrder("varying") ?? NaN,
      }),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );
    const set = (id: string, type: MathItemType, properties: object) =>
      act(() => {
        store.dispatch(actions.setProperties({ id, type, properties }));
      });
    return { result, set };
  };

  test("orders by evaluated opacity, following changes", async () => {
    const { result, set } = setup();
    await waitFor(() =>
      expect(result.current.varying).toBeLessThan(result.current.translucent),
    );
    set("a", MathItemType.Variable, {
      value: { type: "assignment", lhs: "a", rhs: "0.5" },
    });
    await waitFor(() =>
      expect(result.current.varying).toBeGreaterThan(
        result.current.translucent,
      ),
    );
  });

  test("keeps the last opacity while an opacity errors, as the graphic does", async () => {
    const { result, set } = setup();
    set("a", MathItemType.Variable, {
      value: { type: "assignment", lhs: "a", rhs: "0.5" },
    });
    await waitFor(() =>
      expect(result.current.varying).toBeGreaterThan(
        result.current.translucent,
      ),
    );
    // An error discards the scope's result; without it the surface would
    // count as opaque.
    set("varying", MathItemType.ExplicitSurface, { opacity: "a+" });
    expect(result.current.varying).toBeGreaterThan(result.current.translucent);
  });
});

describe("useZOrders", () => {
  const setup = (zOrder: string) => {
    const scene = new SceneBuilder();
    scene.folder().point({}, "defaulted").point({ zOrder }, "own");
    const store = getStore();
    store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
    const { result } = renderHook(
      () => ({
        zOrders: useZOrders(),
        defaulted: useDefaultZOrder("defaulted"),
      }),
      {
        wrapper: ({ children }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );
    return { result, store };
  };

  test("gives a graphic its own zOrder, rounded as MathBox's is, else its default", async () => {
    const { result } = setup("7.5");
    await waitFor(() => expect(result.current.zOrders.own).toBe(8));
    expect(result.current.zOrders.defaulted).toBe(result.current.defaulted);
  });

  test("keeps a zOrder once it is emptied", async () => {
    const { result, store } = setup("7");
    await waitFor(() => expect(result.current.zOrders.own).toBe(7));
    act(() => {
      store.dispatch(
        actions.patchProperty({ id: "own", path: "/zOrder", value: "" }),
      );
    });
    expect(result.current.zOrders.own).toBe(7);
  });
});
