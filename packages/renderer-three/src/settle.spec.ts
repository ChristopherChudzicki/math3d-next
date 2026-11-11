import { expect, test, vi } from "vitest";
import { Settle } from "./settle";

const setup = () => {
  const queued = new Map<number, () => void>();
  let next = 0;
  const frames = {
    request: (callback: () => void) => {
      next += 1;
      queued.set(next, callback);
      return next;
    },
    cancel: (id: number) => queued.delete(id),
  };
  /** Runs the callbacks requested before this animation frame. */
  const animationFrame = () => {
    const callbacks = [...queued.values()];
    queued.clear();
    callbacks.forEach((callback) => callback());
  };
  const redraw = { pending: false };
  const onSettled = vi.fn();
  const settle = new Settle(() => redraw.pending, onSettled, frames);
  return { settle, onSettled, redraw, animationFrame };
};

test("waits for the ResizeObserver's first report and the draw after it", () => {
  const { settle, onSettled, animationFrame } = setup();
  settle.drawn();
  animationFrame();
  expect(onSettled).not.toHaveBeenCalled();

  settle.resized();
  animationFrame();
  expect(onSettled).not.toHaveBeenCalled();
  settle.drawn();
  animationFrame();
  expect(onSettled).toHaveBeenCalledOnce();
});

test("waits while a redraw is pending", () => {
  const { settle, onSettled, redraw, animationFrame } = setup();
  settle.resized();
  settle.drawn();
  redraw.pending = true;
  animationFrame();
  expect(onSettled).not.toHaveBeenCalled();

  redraw.pending = false;
  settle.drawn();
  animationFrame();
  expect(onSettled).toHaveBeenCalledOnce();
});

test("settles once", () => {
  const { settle, onSettled, animationFrame } = setup();
  settle.resized();
  settle.drawn();
  animationFrame();
  settle.drawn();
  animationFrame();
  expect(onSettled).toHaveBeenCalledOnce();
});
