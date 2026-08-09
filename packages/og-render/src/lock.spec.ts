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
