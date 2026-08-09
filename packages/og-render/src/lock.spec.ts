import { env } from "cloudflare:test";
import { afterEach, expect, it } from "vitest";
import { acquireLock, releaseLock } from "./lock";
import { lockKey } from "./keys";

afterEach(() => env.OG_BUCKET.delete(lockKey("k")));

it("first acquire returns a token, second returns null while held", async () => {
  expect(await acquireLock(env as never, "k")).toEqual(expect.any(String));
  expect(await acquireLock(env as never, "k")).toBeNull();
});

it("acquire succeeds again after release", async () => {
  const token = await acquireLock(env as never, "k");
  expect(token).not.toBeNull();
  await releaseLock(env as never, "k", token!);
  expect(await acquireLock(env as never, "k")).not.toBeNull();
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
  expect(await acquireLock(env as never, "k")).not.toBeNull();
});

it("does not take over a fresh lock", async () => {
  await env.OG_BUCKET.put(lockKey("k"), String(Date.now()));
  expect(await acquireLock(env as never, "k")).toBeNull();
});

it("concurrent takeovers of one stale lock yield exactly one winner", async () => {
  await env.OG_BUCKET.put(lockKey("k"), String(Date.now() - 5 * 60_000));
  const results = await Promise.all(
    Array.from({ length: 5 }, () => acquireLock(env as never, "k")),
  );
  expect(results.filter(Boolean)).toHaveLength(1);
});

it("release deletes the lock only when it still holds our token", async () => {
  const token = await acquireLock(env as never, "k");
  expect(token).not.toBeNull();
  await releaseLock(env as never, "k", token!);
  expect(await env.OG_BUCKET.get(lockKey("k"))).toBeNull();
});

it("release is a no-op when the lock was taken over (superseded token)", async () => {
  // A slow render's holder was taken over as stale; its release must NOT delete
  // the new holder's lock and let a third render start (the single-flight bug).
  const original = await acquireLock(env as never, "k");
  expect(original).not.toBeNull();
  // Simulate a takeover: the lock now carries a different holder's token.
  const newHolder = String(Date.now() + 1);
  await env.OG_BUCKET.put(lockKey("k"), newHolder);

  await releaseLock(env as never, "k", original!);

  const still = await env.OG_BUCKET.get(lockKey("k"));
  expect(still).not.toBeNull(); // the new holder's lock survives
  expect(await still!.text()).toBe(newHolder);
});
