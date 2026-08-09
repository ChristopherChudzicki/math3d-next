import type { Env } from "./env";
import { lockKey } from "./keys";

/**
 * A lock older than this is treated as abandoned and may be taken over. Must
 * exceed the worst-case render time (nav 30s + readiness 20s + screenshot, all
 * inside ctx.waitUntil) with margin. An isolate evicted mid-render can't run its
 * `finally` release, so without this a crashed render would wedge the scene's
 * image until the R2 lifecycle rule swept it — up to a day, and only if that
 * (unversioned, easily-forgotten) rule is actually provisioned.
 */
const LOCK_STALE_MS = 120_000;

/**
 * Atomic create-if-absent using R2's conditional put. `etagDoesNotMatch: "*"`
 * is the If-None-Match:* semantic — the put is a no-op (returns null) when the
 * object already exists, which is strongly consistent across colos (unlike KV).
 * This is the single-flight guarantee: exactly one concurrent caller writes the
 * lock and gets `true`.
 *
 * Self-healing: the lock body is the acquire timestamp. If the create loses to
 * an existing lock, we read it and — only if it's older than LOCK_STALE_MS —
 * take it over with a second conditional put keyed to the stale object's etag.
 * That takeover is itself atomic (`etagMatches`), so two callers racing to
 * reclaim the same stale lock still yield exactly one winner. A fresh lock is
 * left untouched (returns false). This makes a crashed render self-recover
 * within ~2 min instead of depending solely on the R2 lifecycle backstop.
 */
export const acquireLock = async (env: Env, key: string): Promise<boolean> => {
  const now = Date.now();
  const created = await env.OG_BUCKET.put(lockKey(key), String(now), {
    onlyIf: { etagDoesNotMatch: "*" },
  });
  if (created !== null) return true;

  // Lock is held. Reclaim it only if it is stale.
  const existing = await env.OG_BUCKET.get(lockKey(key));
  if (existing === null) return false; // released between our put and get; yield
  const heldAt = Number(await existing.text());
  if (Number.isFinite(heldAt) && now - heldAt < LOCK_STALE_MS) return false;

  const taken = await env.OG_BUCKET.put(lockKey(key), String(now), {
    onlyIf: { etagMatches: existing.etag },
  });
  return taken !== null;
};

export const releaseLock = (env: Env, key: string): Promise<void> =>
  env.OG_BUCKET.delete(lockKey(key));
