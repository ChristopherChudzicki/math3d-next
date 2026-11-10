import React from "react";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import type { Coords } from "@math3d/viewport-spec";
import { storeWithScene } from "@/test_util/renderGraphicSpec";
import { actions } from "@/store/scene/state/scene.slice";
import { fromUi } from "@/features/viewport/shared/coordinates";
import { MOVE_END_DELAY } from "./useCameraWriteBack";
import { useViewportSpec } from "./useViewportSpec";

const MOVED = "[1.00000,-1.00000,0.500000]";

const setup = (scene: SceneBuilder) => {
  vi.useFakeTimers();
  const store = storeWithScene(scene);
  const host = { current: document.createElement("div") };
  const { result, unmount } = renderHook(() => useViewportSpec(host), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
  // Results load in an effect, so the evaluated camera replaces the first
  // render's defaults with one bump.
  const initial = result.current.spec.cameraRevision;
  /** Revisions since setup. */
  const revision = () => result.current.spec.cameraRevision - initial;
  const storedPosition = () => {
    const { camera } = store.getState().scene.items;
    invariant(camera.type === MathItemType.Camera);
    return camera.properties.position;
  };
  const patch = (id: string, path: string, value: string) =>
    act(() => {
      store.dispatch(actions.patchProperty({ id, path, value }));
    });
  /** Reports the camera at `position` (stored coordinates), then fires `event`. */
  const move = (position: Coords, event: Event) => {
    const { range, scale, camera } = result.current.spec;
    result.current.onCameraMove({
      position: fromUi(position, range, scale, false),
      target: camera.target,
    });
    host.current.dispatchEvent(event);
  };
  const wait = () =>
    act(() => {
      vi.advanceTimersByTime(MOVE_END_DELAY);
    });
  const release = (position: Coords) => {
    move(position, new PointerEvent("pointerup"));
    wait();
  };
  /** A pointerup with no camera move before it. */
  const click = () => {
    host.current.dispatchEvent(new PointerEvent("pointerup"));
    wait();
  };
  return {
    unmount,
    revision,
    storedPosition,
    patch,
    move,
    wait,
    release,
    click,
  };
};

afterEach(() => {
  vi.useRealTimers();
});

test(`writes the move to the camera item ${MOVE_END_DELAY} ms after pointerup`, () => {
  const { storedPosition, move, wait } = setup(new SceneBuilder());
  move([1, -1, 0.5], new PointerEvent("pointerup"));
  act(() => {
    vi.advanceTimersByTime(MOVE_END_DELAY - 1);
  });
  expect(storedPosition()).not.toBe(MOVED);
  wait();
  expect(storedPosition()).toBe(MOVED);
});

test("writes after a wheel move with no pointerup", () => {
  const { storedPosition, move, wait } = setup(new SceneBuilder());
  move([1, -1, 0.5], new WheelEvent("wheel"));
  wait();
  expect(storedPosition()).toBe(MOVED);
});

test("a pointer held down defers a wheel move until it is released", () => {
  const { storedPosition, move, wait } = setup(new SceneBuilder());
  const before = storedPosition();
  move([1, -1, 0.5], new PointerEvent("pointerdown"));
  move([1, -1, 0.5], new WheelEvent("wheel"));
  wait();
  expect(storedPosition()).toBe(before);
  move([1, -1, 0.5], new PointerEvent("pointerup"));
  wait();
  expect(storedPosition()).toBe(MOVED);
});

test("pointercancel releases a pointer like pointerup", () => {
  const { storedPosition, move, wait } = setup(new SceneBuilder());
  move([1, -1, 0.5], new PointerEvent("pointerdown"));
  move([1, -1, 0.5], new PointerEvent("pointercancel"));
  wait();
  expect(storedPosition()).toBe(MOVED);
});

test("a pending move writes nothing after unmount", () => {
  const { unmount, storedPosition, move, wait } = setup(new SceneBuilder());
  const before = storedPosition();
  move([1, -1, 0.5], new PointerEvent("pointerup"));
  unmount();
  wait();
  expect(storedPosition()).toBe(before);
});

test.each([true, false])(
  "a move that went nowhere changes nothing (updateOnDrag %s)",
  (updateOnDrag) => {
    const scene = new SceneBuilder().camera({
      position: "[0.5, -2, 0.5]",
      updateOnDrag: String(updateOnDrag),
    });
    const { revision, storedPosition, release } = setup(scene);
    const before = storedPosition();
    release([0.5, -2, 0.5]);
    expect(storedPosition()).toBe(before);
    expect(revision()).toBe(0);
  },
);

test("a written move bumps the revision through the stored camera", () => {
  const { revision, release } = setup(new SceneBuilder());
  release([1, -1, 0.5]);
  expect(revision()).toBe(1);
});

test("with updateOnDrag off, a move bumps the revision and writes nothing", () => {
  const scene = new SceneBuilder().camera({ updateOnDrag: "false" });
  const { revision, storedPosition, release } = setup(scene);
  const before = storedPosition();
  release([1, -1, 0.5]);
  expect(storedPosition()).toBe(before);
  expect(revision()).toBe(1);
});

test("a move end consumes the move, so a later click snaps nothing back", () => {
  const scene = new SceneBuilder().camera({ updateOnDrag: "false" });
  const { revision, release, click } = setup(scene);
  release([1, -1, 0.5]);
  click();
  expect(revision()).toBe(1);
});

test.each([
  {
    name: "the stored camera",
    id: "camera",
    path: "/target",
    value: "[1,0,0]",
  },
  { name: "the axes' range", id: "axis-x", path: "/max", value: "10" },
  { name: "the axes' scale", id: "axis-y", path: "/scale", value: "2" },
])("editing $name bumps the revision", ({ id, path, value }) => {
  const { revision, patch } = setup(new SceneBuilder());
  patch(id, path, value);
  expect(revision()).toBe(1);
});

test("an unrelated edit keeps the revision", () => {
  const scene = new SceneBuilder();
  scene.folder().point({}, "p");
  const { revision, patch } = setup(scene);
  patch("p", "/coords", "[1,2,3]");
  expect(revision()).toBe(0);
});
