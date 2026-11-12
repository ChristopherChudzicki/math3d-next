import React from "react";
import { act, render } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";
import { storeWithScene } from "@/test_util/storeWithScene";
import { actions } from "@/store/scene/state/scene.slice";
import type { ImplicitSurfaceSpec } from "@math3d/viewport-spec";
import { useViewportSpec } from "./useViewportSpec";

test("an implicit surface is the zero level set of lhs − rhs", () => {
  const scene = new SceneBuilder();
  scene.folder().implicitSurface({}, "s");
  const spec = renderGraphicSpec(scene, "s") as ImplicitSurfaceSpec;
  // The defaults: x² + y² = z² + 1.
  expect(spec.value(1, 2, 3)).toBe(5 - 10);
});

test("a variable that only styles the surface leaves the spec's value function as it was", () => {
  const scene = new SceneBuilder();
  const folder = scene.folder();
  folder.variable({ value: { type: "assignment", lhs: "a", rhs: "1" } }, "a");
  folder.implicitSurface({ opacity: "a" }, "s");
  const store = storeWithScene(scene);
  const specs: ImplicitSurfaceSpec[] = [];
  const Harness = () => {
    const { spec, reporters } = useViewportSpec({ current: null });
    const surface = spec.graphics.find(({ id }) => id === "s")?.spec;
    if (surface && surface !== specs.at(-1)) {
      specs.push(surface as ImplicitSurfaceSpec);
    }
    return reporters;
  };
  render(
    <Provider store={store}>
      <Harness />
    </Provider>,
  );
  act(() => {
    store.dispatch(
      actions.patchProperty({
        id: "a",
        path: "/value",
        value: { type: "assignment", lhs: "a", rhs: "0.5" },
      }),
    );
  });
  expect(specs.map(({ color }) => color[3])).toEqual([1, 0.5]);
  expect(specs[1].value).toBe(specs[0].value);
});
