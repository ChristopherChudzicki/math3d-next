import { SETTLE_QUIET_MS, makeSettleWatch } from "./settle";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const setup = () => {
  const onSettled = vi.fn();
  return { onSettled, watch: makeSettleWatch(onSettled) };
};

test("frames before arm() don't count", () => {
  const { onSettled, watch } = setup();
  watch.frame();
  watch.arm();
  vi.advanceTimersByTime(2 * SETTLE_QUIET_MS);
  expect(onSettled).not.toHaveBeenCalled();

  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS);
  expect(onSettled).toHaveBeenCalledOnce();
});

test("a frame restarts the countdown", () => {
  const { onSettled, watch } = setup();
  watch.arm();
  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS - 1);
  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS - 1);
  expect(onSettled).not.toHaveBeenCalled();

  vi.advanceTimersByTime(1);
  expect(onSettled).toHaveBeenCalledOnce();
});

test("waits for every pending compile, however long", () => {
  const { onSettled, watch } = setup();
  watch.arm();
  watch.frame();
  watch.compileStarted();
  watch.compileStarted();
  watch.compileEnded();
  vi.advanceTimersByTime(10 * SETTLE_QUIET_MS);
  expect(onSettled).not.toHaveBeenCalled();

  watch.compileEnded();
  vi.advanceTimersByTime(SETTLE_QUIET_MS);
  expect(onSettled).toHaveBeenCalledOnce();
});

test("settles once", () => {
  const { onSettled, watch } = setup();
  watch.arm();
  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS);
  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS);
  expect(onSettled).toHaveBeenCalledOnce();
});
