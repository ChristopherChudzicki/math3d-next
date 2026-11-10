import React from "react";
import { renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder, makeItem } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import type { AxesRange, Coords } from "@math3d/viewport-spec";
import { storeWithScene } from "@/test_util/renderGraphicSpec";
import { fromUi } from "@/features/viewport/shared/coordinates";
import { useCameraSpec } from "./camera";

const range: AxesRange = [
  [-5, 5],
  [-5, 5],
  [-5, 5],
];
const scale: Coords = [1, 2, 0.5];

const renderCameraSpec = (
  scene: SceneBuilder,
  camera: MathItem<MathItemType.Camera>,
) => {
  const store = storeWithScene(scene);
  return renderHook(() => useCameraSpec(camera, range, scale), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
};

const sceneCamera = (scene: SceneBuilder) => {
  const camera = scene.items.find((x) => x.id === "camera");
  invariant(camera?.type === MathItemType.Camera);
  return camera;
};

test("defaults the camera and its controls before anything evaluates", () => {
  // A camera the scene doesn't hold has no results.
  const { result } = renderCameraSpec(
    new SceneBuilder(),
    makeItem(MathItemType.Camera, {}, "unevaluated"),
  );
  expect(result.current).toEqual({
    camera: {
      position: fromUi([0.5, -2, 0.5], range, scale, false),
      target: fromUi([0, 0, 0], range, scale, false),
    },
    orthographic: false,
    controls: { rotate: true, pan: true, zoom: true },
  });
});

test("reports the camera item's projection and enabled controls", () => {
  const scene = new SceneBuilder().camera({
    isOrthographic: "true",
    isRotateEnabled: "false",
    isPanEnabled: "true",
    isZoomEnabled: "false",
  });
  const { result } = renderCameraSpec(scene, sceneCamera(scene));
  expect(result.current).toMatchObject({
    orthographic: true,
    controls: { rotate: false, pan: true, zoom: false },
  });
});

test("a relative camera position is a fraction of the axes' scale", () => {
  const scene = new SceneBuilder().camera({
    useRelative: "true",
    position: "[1, 1, 1]",
  });
  const { result } = renderCameraSpec(scene, sceneCamera(scene));
  expect(result.current.camera.position).toEqual(scale);
});

test("keeps its identity across rerenders", () => {
  const scene = new SceneBuilder();
  const { result, rerender } = renderCameraSpec(scene, sceneCamera(scene));
  const before = result.current;
  rerender();
  expect(result.current).toBe(before);
});
