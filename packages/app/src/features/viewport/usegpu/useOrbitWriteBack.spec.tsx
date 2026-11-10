import React from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { fromUi } from "@/features/viewport/shared/coordinates";
import type { AxesRange, Coords } from "@math3d/viewport-spec";
import { toOrbit } from "./orbit";
import { useOrbitWriteBack } from "./useOrbitWriteBack";

const range: AxesRange = [
  [-5, 5],
  [-5, 5],
  [-5, 5],
];
const scale: Coords = [1, 2, 0.5];
const stored = {
  position: [0.5, -2, 0.5] as Coords,
  target: [0, 0, 0] as Coords,
};

/** The orbit that puts the camera at `position`, given relative to `scale`. */
const orbitFor = (position: Coords) =>
  toOrbit({
    position: fromUi(position, range, scale, true),
    target: fromUi(stored.target, range, scale, true),
  });

const setup = (updateOnDrag: boolean) => {
  vi.useFakeTimers();
  const store = getStore();
  const scene = new SceneBuilder();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  const host = { current: document.createElement("div") };
  const { result, unmount } = renderHook(
    () =>
      useOrbitWriteBack(
        host,
        { id: "camera", ...stored, useRelative: true, updateOnDrag },
        range,
        scale,
      ),
    {
      wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
    },
  );
  const storedPosition = () => {
    const { camera } = store.getState().scene.items;
    invariant(camera.type === MathItemType.Camera);
    return camera.properties.position;
  };
  const move = (position: Coords, event: Event) => {
    result.current.onOrbit(orbitFor(position));
    host.current.dispatchEvent(event);
  };
  const wait = () =>
    act(() => {
      vi.advanceTimersByTime(200);
    });
  const release = (position: Coords) => {
    move(position, new PointerEvent("pointerup"));
    wait();
  };
  return { result, unmount, storedPosition, move, wait, release };
};

afterEach(() => {
  vi.useRealTimers();
});

test("dispatches the stored-coordinate patches 200 ms after pointerup", () => {
  const { storedPosition, release } = setup(true);
  release([1, -1, 0.5]);
  expect(storedPosition()).toBe("[1.00000,-1.00000,0.500000]");
});

test("dispatches after a wheel move with no pointerup", () => {
  const { storedPosition, move, wait } = setup(true);
  move([1, -1, 0.5], new WheelEvent("wheel"));
  wait();
  expect(storedPosition()).toBe("[1.00000,-1.00000,0.500000]");
});

test.each([true, false])(
  "does nothing when the orbit did not move (updateOnDrag %s)",
  (updateOnDrag) => {
    const { result, storedPosition, release } = setup(updateOnDrag);
    const before = storedPosition();
    release(stored.position);
    expect(storedPosition()).toBe(before);
    expect(result.current.controlsVersion).toBe(0);
  },
);

test("a pending move dispatches nothing after unmount", () => {
  const { unmount, storedPosition, move, wait } = setup(true);
  const before = storedPosition();
  move([1, -1, 0.5], new PointerEvent("pointerup"));
  unmount();
  wait();
  expect(storedPosition()).toBe(before);
});

test("with updateOnDrag off it bumps controlsVersion instead of dispatching", () => {
  const { result, storedPosition, release } = setup(false);
  const before = storedPosition();
  release([1, -1, 0.5]);
  expect(storedPosition()).toBe(before);
  expect(result.current.controlsVersion).toBe(1);
});

test("a pointer held down defers a wheel move until it is released", () => {
  const { storedPosition, move, wait } = setup(true);
  const before = storedPosition();
  move([1, -1, 0.5], new PointerEvent("pointerdown"));
  move([1, -1, 0.5], new WheelEvent("wheel"));
  wait();
  expect(storedPosition()).toBe(before);
  move([1, -1, 0.5], new PointerEvent("pointerup"));
  wait();
  expect(storedPosition()).toBe("[1.00000,-1.00000,0.500000]");
});

test("pointercancel releases a pointer like pointerup", () => {
  const { storedPosition, move, wait } = setup(true);
  move([1, -1, 0.5], new PointerEvent("pointerdown"));
  move([1, -1, 0.5], new PointerEvent("pointercancel"));
  wait();
  expect(storedPosition()).toBe("[1.00000,-1.00000,0.500000]");
});
