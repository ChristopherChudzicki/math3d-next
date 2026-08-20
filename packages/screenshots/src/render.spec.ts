import { env } from "cloudflare:test";
import { expect, it, vi } from "vitest";
import { renderScene, withTimeout } from "./render";

it("withTimeout rejects and lets finally run when work outlives the deadline", async () => {
  vi.useFakeTimers();
  const never = new Promise(() => {});
  const p = withTimeout(50, () => never);
  vi.advanceTimersByTime(51);
  await expect(p).rejects.toThrow(/deadline/i);
  vi.useRealTimers();
});

it("withTimeout resolves with fn's value when work finishes before the deadline", async () => {
  await expect(withTimeout(50, async () => "ok")).resolves.toBe("ok");
});

it("closes the browser and rejects when a render outlives the deadline", async () => {
  const close = vi.fn().mockResolvedValue(undefined);
  const fakeBrowser = {
    newPage: async () => ({
      setViewport: async () => {},
      goto: () => new Promise(() => {}), // never settles → outlives the deadline
      waitForSelector: async () => {},
      screenshot: async () => new Uint8Array(),
    }),
    close,
  };
  const launch = vi.fn().mockResolvedValue(fakeBrowser);
  // Tiny REAL deadline (1ms): no fake-timer/microtask interleaving to get right,
  // and nothing real launches, so this resolves in ~1ms — NOT the 60s production
  // RENDER_DEADLINE_MS. The never-settling goto guarantees the deadline wins.
  await expect(
    renderScene(env as never, "k", 1, launch as never),
  ).rejects.toThrow(/deadline/i);
  expect(close).toHaveBeenCalled(); // closed on timeout, aborting the hung op
});
