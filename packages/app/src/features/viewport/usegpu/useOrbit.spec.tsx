import React from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { storeWithScene } from "@/test_util/storeWithScene";
import { fromUi } from "@/features/viewport/shared/coordinates";
import { actions } from "@/store/scene/state/scene.slice";
import { useViewportSpec } from "@/features/viewport/spec/useViewportSpec";
import { MOVE_END_DELAY } from "@/features/viewport/spec/useCameraWriteBack";
import { toOrbit } from "./orbit";
import { useOrbit } from "./useOrbit";

const renderUseOrbit = (scene: SceneBuilder) => {
  const store = storeWithScene(scene);
  const host = { current: document.createElement("div") };
  const view = renderHook(
    () => {
      const { spec, onCameraMove } = useViewportSpec(host);
      return { spec, ...useOrbit(spec, onCameraMove, host) };
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

const renderOrbit = (scene: SceneBuilder) =>
  renderUseOrbit(scene).result.current;

test.each([
  { isOrthographic: "false", dolly: 1 },
  { isOrthographic: "true", dolly: 0 },
])(
  "isOrthographic $isOrthographic gets dolly $dolly",
  ({ isOrthographic, dolly }) => {
    const scene = new SceneBuilder().camera({ isOrthographic });
    expect(renderOrbit(scene).projection).toEqual({
      dolly,
    });
  },
);

test("keeps the same orbit across rerenders, so the user's pan survives", () => {
  const scene = new SceneBuilder();
  const { result, rerender } = renderUseOrbit(scene);
  const { orbit } = result.current;
  rerender();
  expect(result.current.orbit).toBe(orbit);
});

test("a pinch halves the radius the controls last reported, keeping their target", () => {
  const scene = new SceneBuilder();
  const { result, pinchOut } = renderUseOrbit(scene);
  const { orbit } = result.current;
  result.current.onOrbit({ ...orbit, radius: 3 });
  pinchOut();
  expect(result.current.orbit).toEqual({ ...orbit, radius: 1.5 });
  expect(result.current.orbit.target).toBe(orbit.target);
});

test("a camera with zoom disabled ignores pinches", () => {
  const scene = new SceneBuilder().camera({ isZoomEnabled: "false" });
  const { result, pinchOut } = renderUseOrbit(scene);
  const { orbit } = result.current;
  pinchOut();
  expect(result.current.orbit).toBe(orbit);
});

test("the controls snapping back drop the pinch", () => {
  vi.useFakeTimers();
  const scene = new SceneBuilder().camera({ updateOnDrag: "false" });
  const { result, pinchOut } = renderUseOrbit(scene);
  const { orbit, controlsVersion } = result.current;
  const lift = pinchOut();
  result.current.onOrbit(result.current.orbit);
  lift();
  act(() => {
    vi.advanceTimersByTime(MOVE_END_DELAY);
  });
  expect(result.current.controlsVersion).toBe(controlsVersion + 1);
  expect(result.current.orbit).toBe(orbit);
});

test("editing the camera item drops the pinch", () => {
  const scene = new SceneBuilder();
  const { result, store, pinchOut } = renderUseOrbit(scene);
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
  const { range, scale } = result.current.spec;
  expect(result.current.orbit).toEqual(
    toOrbit({
      position: fromUi([1, -1, 0.5], range, scale, false),
      target: fromUi([0, 0, 0], range, scale, false),
    }),
  );
});
