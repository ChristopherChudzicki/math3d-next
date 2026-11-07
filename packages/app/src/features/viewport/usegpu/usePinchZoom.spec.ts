import { renderHook } from "@testing-library/react";
import { usePinchZoom } from "./usePinchZoom";

const setup = (enabled = true) => {
  const host = document.createElement("div");
  const canvas = host.appendChild(document.createElement("canvas"));
  const start = vi.fn();
  const move = vi.fn();
  renderHook(() => usePinchZoom({ current: host }, enabled, { start, move }));
  const canvasMoves = vi.fn();
  canvas.addEventListener("pointermove", canvasMoves);
  /** A touch pointer event, dispatched at the canvas. */
  const touch = (type: string, pointerId: number, x = 0, y = 0) =>
    canvas.dispatchEvent(
      Object.assign(
        new MouseEvent(type, { bubbles: true, clientX: x, clientY: y }),
        { pointerId, pointerType: "touch" },
      ),
    );
  return { start, move, canvasMoves, touch };
};

test("spreading two fingers to twice their distance reports a ratio of 1/2", () => {
  const { start, move, touch } = setup();
  touch("pointerdown", 1, 0, 0);
  touch("pointerdown", 2, 10, 0);
  touch("pointermove", 2, 20, 0);
  expect(start).toHaveBeenCalledTimes(1);
  expect(move).toHaveBeenLastCalledWith(0.5);
});

test("a lifted finger's replacement restarts the pinch from the new pair", () => {
  const { start, move, touch } = setup();
  touch("pointerdown", 1, 0, 0);
  touch("pointerdown", 2, 10, 0);
  touch("pointerup", 2);
  touch("pointerdown", 3, 40, 0);
  touch("pointermove", 3, 20, 0);
  expect(start).toHaveBeenCalledTimes(2);
  expect(move).toHaveBeenLastCalledWith(2);
});

test("touch moves reach the canvas until a second finger lands, then not until every finger lifts", () => {
  const { canvasMoves, touch } = setup();
  touch("pointerdown", 1, 0, 0);
  touch("pointermove", 1, 5, 0);
  expect(canvasMoves).toHaveBeenCalledTimes(1);
  touch("pointerdown", 2, 10, 0);
  touch("pointerup", 2);
  touch("pointermove", 1, 6, 0);
  expect(canvasMoves).toHaveBeenCalledTimes(1);
  touch("pointerup", 1);
  touch("pointerdown", 1, 0, 0);
  touch("pointermove", 1, 5, 0);
  expect(canvasMoves).toHaveBeenCalledTimes(2);
});

test("disabled, it reports no pinch but still keeps two-finger moves from the canvas", () => {
  const { start, move, canvasMoves, touch } = setup(false);
  touch("pointerdown", 1, 0, 0);
  touch("pointerdown", 2, 10, 0);
  touch("pointermove", 2, 20, 0);
  expect(start).not.toHaveBeenCalled();
  expect(move).not.toHaveBeenCalled();
  expect(canvasMoves).not.toHaveBeenCalled();
});
