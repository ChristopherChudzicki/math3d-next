import { SETTLE_QUIET_MS, makeSettleWatch } from "./settle";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test("settles once frames drawn since arm() go quiet", () => {
  const onSettled = vi.fn();
  const watch = makeSettleWatch(onSettled);

  watch.frame();
  vi.advanceTimersByTime(2 * SETTLE_QUIET_MS);
  expect(onSettled).not.toHaveBeenCalled();

  watch.arm();
  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS - 1);
  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS - 1);
  expect(onSettled).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(onSettled).toHaveBeenCalledOnce();

  watch.frame();
  vi.advanceTimersByTime(SETTLE_QUIET_MS);
  expect(onSettled).toHaveBeenCalledOnce();
});

test("waits for every pending compile, however long", () => {
  const onSettled = vi.fn();
  const watch = makeSettleWatch(onSettled);
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
