import React from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { storeWithScene } from "@/test_util/renderGraphicSpec";
import { fromUi } from "@/features/viewport/shared/coordinates";
import type { AxesRange, Coords } from "@math3d/viewport-spec";
import { actions } from "@/store/scene/state/scene.slice";
import { useCameraSpec } from "@/features/viewport/spec/camera";
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
  const view = renderHook(
    () => {
      const fields = useCameraSpec(camera, range, scale);
      return useOrbit({ ...fields, range, scale }, camera, host);
    },
    {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    },
  );
  /** Two touches 10px apart, spread to 20px: a pinch with ratio 1/2. */
  const pinchOut = () => {
    const touch = (type: string, pointerId: number, x: number) =>
      host.current.dispatchEvent(
        Object.assign(new MouseEvent(type, { clientX: x }), {
          pointerId,
          pointerType: "touch",
        }),
      );
    act(() => {
      touch("pointerdown", 1, 0);
      touch("pointerdown", 2, 10);
      touch("pointermove", 2, 20);
    });
    return () =>
      act(() => {
        touch("pointerup", 1, 0);
        touch("pointerup", 2, 20);
      });
  };
  return { ...view, store, pinchOut };
};

afterEach(() => {
  vi.useRealTimers();
});

const sceneCamera = (scene: SceneBuilder) => {
  const camera = scene.items.find((x) => x.id === "camera");
  invariant(camera?.type === MathItemType.Camera);
  return camera;
};

const renderOrbit = (
  scene: SceneBuilder,
  camera: MathItem<MathItemType.Camera>,
) => renderUseOrbit(scene, camera).result.current;

test("an orthographic camera gets dolly 0", () => {
  const scene = new SceneBuilder().camera({ isOrthographic: "true" });
  expect(renderOrbit(scene, sceneCamera(scene)).projection).toEqual({
    dolly: 0,
  });
});

test("keeps the same orbit across rerenders, so the user's pan survives", () => {
  const scene = new SceneBuilder();
  const { result, rerender } = renderUseOrbit(scene, sceneCamera(scene));
  const { orbit } = result.current;
  rerender();
  expect(result.current.orbit).toBe(orbit);
});

test("a pinch halves the radius the controls last reported, keeping their target", () => {
  const scene = new SceneBuilder();
  const { result, pinchOut } = renderUseOrbit(scene, sceneCamera(scene));
  const { orbit } = result.current;
  result.current.onOrbit({ ...orbit, radius: 3 });
  pinchOut();
  expect(result.current.orbit).toEqual({ ...orbit, radius: 1.5 });
  expect(result.current.orbit.target).toBe(orbit.target);
});

test("a camera with zoom disabled ignores pinches", () => {
  const scene = new SceneBuilder().camera({ isZoomEnabled: "false" });
  const { result, pinchOut } = renderUseOrbit(scene, sceneCamera(scene));
  const { orbit } = result.current;
  pinchOut();
  expect(result.current.orbit).toBe(orbit);
});

test("the controls snapping back drop the pinch", () => {
  vi.useFakeTimers();
  const scene = new SceneBuilder().camera({ updateOnDrag: "false" });
  const { result, pinchOut } = renderUseOrbit(scene, sceneCamera(scene));
  const { orbit } = result.current;
  const lift = pinchOut();
  result.current.onOrbit(result.current.orbit);
  lift();
  act(() => {
    vi.advanceTimersByTime(200);
  });
  expect(result.current.controlsVersion).toBe(1);
  expect(result.current.orbit).toBe(orbit);
});

test("editing the camera item drops the pinch", () => {
  const scene = new SceneBuilder();
  const { result, store, pinchOut } = renderUseOrbit(scene, sceneCamera(scene));
  pinchOut();
  act(() => {
    store.dispatch(
      actions.patchProperty({
        id: "camera",
        path: "/position",
        value: "[1,-1,0.5]",
      }),
    );
  });
  expect(result.current.orbit).toEqual(
    toOrbit({
      position: fromUi([1, -1, 0.5], range, scale, false),
      target: fromUi([0, 0, 0], range, scale, false),
    }),
  );
});
