import { env } from "cloudflare:test";
import { afterEach, expect, it } from "vitest";
import { acquireLock, releaseLock } from "./lock";
import { lockKey } from "./keys";

afterEach(() => env.OG_BUCKET.delete(lockKey("k")));

it("first acquire succeeds, second fails while held", async () => {
  expect(await acquireLock(env as never, "k")).toBe(true);
  expect(await acquireLock(env as never, "k")).toBe(false);
});

it("acquire succeeds again after release", async () => {
  expect(await acquireLock(env as never, "k")).toBe(true);
  await releaseLock(env as never, "k");
  expect(await acquireLock(env as never, "k")).toBe(true);
});

it("concurrent acquires yield exactly one winner", async () => {
  const results = await Promise.all(
    Array.from({ length: 5 }, () => acquireLock(env as never, "k")),
  );
  expect(results.filter(Boolean)).toHaveLength(1);
});

it("takes over a stale lock (crashed render left it behind)", async () => {
  // A lock body is the acquire timestamp; write one older than the staleness
  // window to stand in for an isolate evicted mid-render before its release.
  const staleTs = Date.now() - 5 * 60_000;
  await env.OG_BUCKET.put(lockKey("k"), String(staleTs));
  expect(await acquireLock(env as never, "k")).toBe(true);
});

it("does not take over a fresh lock", async () => {
  await env.OG_BUCKET.put(lockKey("k"), String(Date.now()));
  expect(await acquireLock(env as never, "k")).toBe(false);
});

it("concurrent takeovers of one stale lock yield exactly one winner", async () => {
  await env.OG_BUCKET.put(lockKey("k"), String(Date.now() - 5 * 60_000));
  const results = await Promise.all(
    Array.from({ length: 5 }, () => acquireLock(env as never, "k")),
  );
  expect(results.filter(Boolean)).toHaveLength(1);
});
