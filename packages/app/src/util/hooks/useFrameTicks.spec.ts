import { renderHook } from "@testing-library/react";
import { useFrameTicks } from "./useFrameTicks";

/**
 * Stubs requestAnimationFrame so each test chooses its frame timestamps.
 * Returns `ticksAt(times)`: runs one frame per timestamp, and the timeout it
 * sets, then returns `calls()`: the `elapsed` of every onTicks call, rounded
 * to 3 places. `frame(t)` runs one frame without its timeout.
 */
const setup = (fps: number | null) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  let pending: { id: number; cb: FrameRequestCallback } | null = null;
  let lastId = 0;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    lastId += 1;
    pending = { id: lastId, cb };
    return lastId;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
    if (pending?.id === id) pending = null;
  });
  const onTicks = vi.fn();
  const view = renderHook(() => useFrameTicks(onTicks, fps));
  const frame = (t: number) => {
    const queued = pending;
    pending = null;
    queued?.cb(t);
  };
  const calls = () =>
    onTicks.mock.calls.map(([n]) => Math.round(n * 1000) / 1000);
  const ticksAt = (times: number[]) => {
    times.forEach((t) => {
      frame(t);
      vi.runOnlyPendingTimers();
    });
    return calls();
  };
  return { view, frame, calls, ticksAt };
};

/** Frame timestamps every `period` ms, starting at 0. */
const frames = (period: number, count: number) =>
  Array.from({ length: count }, (_, i) => i * period);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useFrameTicks", () => {
  test("Ticks at most fps times per second on a faster display", () => {
    const { ticksAt } = setup(60);
    // 120 Hz: one tick every other frame.
    expect(ticksAt(frames(1000 / 120, 25))).toEqual(Array(12).fill(1));
  });

  test("Ticks every frame when frame times jitter around 1/fps", () => {
    const { ticksAt } = setup(60);
    // Every other frame 0.3ms early: within the 1.67ms slack.
    const jittered = frames(1000 / 60, 13).map((t, i) => (i % 2 ? t - 0.3 : t));
    expect(ticksAt(jittered)).toHaveLength(12);
  });

  test("Keeps fps on average when it doesn't divide the frame rate", () => {
    const { ticksAt } = setup(50);
    // 120 Hz frames, 20ms period: ticks land 2 or 3 frames apart, and
    // report the time each one covers.
    const ticks = ticksAt(frames(1000 / 120, 121));
    expect(ticks).toHaveLength(50);
    expect(new Set(ticks)).toEqual(new Set([0.833, 1.25]));
  });

  test("Reports every elapsed period on slow frames, then returns to fps", () => {
    const { ticksAt } = setup(60);
    // Two 50ms frames each cover three periods. Then 120 Hz frames: the
    // first is early for the next period, the second is on time.
    expect(ticksAt([0, 50, 100, 100 + 1000 / 120, 100 + 1000 / 60])).toEqual([
      3, 3, 1,
    ]);
  });

  test("Doesn't reset after a long frame while visible", () => {
    const { ticksAt } = setup(10);
    expect(ticksAt([0, 1500, 1600])).toEqual([15, 1]);
  });

  test("Resumes without catching up after the page is hidden", () => {
    const { ticksAt } = setup(10);
    ticksAt([0, 100]);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(ticksAt([5000, 5100])).toEqual([1, 1]);
  });

  test("Doesn't tick for a non-positive fps", () => {
    const { ticksAt } = setup(-10);
    expect(ticksAt(frames(20, 5))).toEqual([]);
  });

  test("Cancels its frame on unmount", () => {
    const { view, ticksAt } = setup(60);
    const before = ticksAt(frames(20, 3));
    view.unmount();
    expect(ticksAt(frames(20, 5))).toEqual(before);
  });

  test("Cancels its timeout on an unmount between a frame and the timeout", () => {
    const { view, frame, calls, ticksAt } = setup(60);
    ticksAt([0]);
    frame(20);
    view.unmount();
    vi.runOnlyPendingTimers();
    expect(calls()).toEqual([]);
  });

  test("Calls onTicks after the frame, not in its callback", () => {
    const { frame, calls, ticksAt } = setup(60);
    ticksAt([0]);
    frame(20);
    expect(calls()).toEqual([]);
    vi.runOnlyPendingTimers();
    expect(calls()).toEqual([1.2]);
  });

  test("Reports two due frames in one call when its timeout runs late", () => {
    const { frame, calls, ticksAt } = setup(60);
    ticksAt([0]);
    frame(20);
    frame(40);
    vi.runOnlyPendingTimers();
    expect(calls()).toEqual([2.4]);
  });
});
