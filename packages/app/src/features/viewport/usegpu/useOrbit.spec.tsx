import React from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder, makeItem } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { storeWithScene } from "@/test_util/renderGraphicSpec";
import { fromUi } from "@/features/viewport/shared/coordinates";
import type { AxesRange, Coords } from "@/features/viewport/shared/coordinates";
import { toOrbit } from "./orbit";
import { useOrbit } from "./useOrbit";

const range: AxesRange = [
  [-5, 5],
  [-5, 5],
  [-5, 5],
];
const scale: Coords = [1, 2, 0.5];

const renderUseOrbit = (
  scene: SceneBuilder,
  camera: MathItem<MathItemType.Camera>,
) => {
  const store = storeWithScene(scene);
  const host = { current: document.createElement("div") };
  return renderHook(() => useOrbit(camera, range, scale, host), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
};

const renderOrbit = (
  scene: SceneBuilder,
  camera: MathItem<MathItemType.Camera>,
) => renderUseOrbit(scene, camera).result.current;

test("defaults the camera and its controls before anything evaluates", () => {
  // A camera the scene doesn't hold has no results.
  const { orbit, controls, projection } = renderOrbit(
    new SceneBuilder(),
    makeItem(MathItemType.Camera, {}, "unevaluated"),
  );
  expect(orbit).toEqual(
    toOrbit({
      position: fromUi([0.5, -2, 0.5], range, scale, false),
      target: fromUi([0, 0, 0], range, scale, false),
    }),
  );
  expect(controls).toEqual({ rotate: true, pan: true, zoom: true });
  expect(projection).toEqual({ dolly: 1 });
});

test("an orthographic camera gets dolly 0", () => {
  const scene = new SceneBuilder().camera({ isOrthographic: "true" });
  const camera = scene.items.find((x) => x.id === "camera");
  invariant(camera?.type === MathItemType.Camera);
  expect(renderOrbit(scene, camera).projection).toEqual({ dolly: 0 });
});

test("keeps the same orbit across rerenders, so the user's pan survives", () => {
  const scene = new SceneBuilder();
  const camera = scene.items.find((x) => x.id === "camera");
  invariant(camera?.type === MathItemType.Camera);
  const { result, rerender } = renderUseOrbit(scene, camera);
  const { orbit } = result.current;
  rerender();
  expect(result.current.orbit).toBe(orbit);
});
