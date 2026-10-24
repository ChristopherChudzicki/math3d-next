import { renderHook } from "@testing-library/react";
import { useFrameTicks } from "./useFrameTicks";

/**
 * Stubs requestAnimationFrame so each test chooses its frame timestamps.
 * Returns `ticksAt(times)`: runs one frame per timestamp, then returns the
 * `elapsed` of every onTicks call, rounded to 3 places.
 */
const setup = (fps: number | null) => {
  let pending: FrameRequestCallback | null = null;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
    pending = cb;
    return 1;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {
    pending = null;
  });
  const onTicks = vi.fn();
  const view = renderHook(() => useFrameTicks(onTicks, fps));
  const ticksAt = (times: number[]) => {
    times.forEach((t) => pending?.(t));
    return onTicks.mock.calls.map(([n]) => Math.round(n * 1000) / 1000);
  };
  return { view, ticksAt };
};

/** Frame timestamps every `period` ms, starting at 0. */
const frames = (period: number, count: number) =>
  Array.from({ length: count }, (_, i) => i * period);

afterEach(() => {
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

  test("Reports every elapsed period when frames are slower than fps", () => {
    const { ticksAt } = setup(60);
    // 20 Hz frames each cover three 60 fps periods.
    expect(ticksAt(frames(50, 5))).toEqual([3, 3, 3, 3]);
  });

  test("Resumes without catching up after frames pause", () => {
    const { ticksAt } = setup(10);
    expect(ticksAt([0, 100, 5000, 5100])).toEqual([1, 1]);
  });

  test("Cancels its frame on unmount", () => {
    const { view, ticksAt } = setup(60);
    view.unmount();
    expect(ticksAt(frames(20, 5))).toEqual([]);
  });
});
