import type { Env } from "./env";
import { lockKey } from "./keys";

/**
 * A lock older than this is treated as abandoned and may be taken over. Must
 * exceed the worst-case successful render — puppeteer.launch + nav (30s) +
 * readiness (45s) + screenshot, all inside ctx.waitUntil — with margin, so a
 * live-but-slow render is never taken over while it is still running (that is
 * what makes the unconditional-delete bug in the old release impossible; see
 * releaseLock). An isolate evicted mid-render can't run its `finally` release,
 * so this window is also what lets a crashed render self-recover instead of
 * wedging the scene's image until the R2 lifecycle rule sweeps it — up to a
 * day, and only if that (unversioned, easily-forgotten) rule is provisioned.
 */
const LOCK_STALE_MS = 180_000;

/**
 * The lock body is the acquire timestamp, which doubles as an ownership token:
 * two legitimate holders of one key are always ≥ LOCK_STALE_MS apart (a fresh
 * lock is never taken over), so their timestamps can never collide, and release
 * can safely compare-and-delete on the exact string it wrote. Returned by
 * acquireLock and passed back to releaseLock.
 */
export type LockToken = string;

/**
 * Atomic create-if-absent using R2's conditional put. `etagDoesNotMatch: "*"`
 * is the If-None-Match:* semantic — the put is a no-op (returns null) when the
 * object already exists, which is strongly consistent across colos (unlike KV).
 * This is the single-flight guarantee: exactly one concurrent caller writes the
 * lock and gets a token.
 *
 * Self-healing: if the create loses to an existing lock, we read it and — only
 * if it's older than LOCK_STALE_MS — take it over with a second conditional put
 * keyed to the stale object's etag. That takeover is itself atomic
 * (`etagMatches`), so two callers racing to reclaim the same stale lock still
 * yield exactly one winner. A fresh lock is left untouched (returns null). This
 * makes a crashed render self-recover within ~LOCK_STALE_MS instead of
 * depending solely on the R2 lifecycle backstop.
 *
 * Returns the ownership token on success, or null if the lock is held fresh.
 */
export const acquireLock = async (
  env: Env,
  key: string,
): Promise<LockToken | null> => {
  const token = String(Date.now());
  const created = await env.SCREENSHOTS_BUCKET.put(lockKey(key), token, {
    onlyIf: { etagDoesNotMatch: "*" },
  });
  if (created !== null) return token;

  // Lock is held. Reclaim it only if it is stale.
  const existing = await env.SCREENSHOTS_BUCKET.get(lockKey(key));
  if (existing === null) return null; // released between our put and get; yield
  const heldAt = Number(await existing.text());
  if (Number.isFinite(heldAt) && Date.now() - heldAt < LOCK_STALE_MS) {
    return null;
  }

  const taken = await env.SCREENSHOTS_BUCKET.put(lockKey(key), token, {
    onlyIf: { etagMatches: existing.etag },
  });
  return taken !== null ? token : null;
};

/**
 * Compare-and-delete: release the lock only if it still holds OUR token. R2's
 * `delete` takes no conditional, so this is a read-then-delete-if-mine rather
 * than an atomic CAS — but it closes the real bug: a *slow* render that was
 * taken over as stale (its holder superseded) must not delete the new holder's
 * lock on its way out and let a third render start. If the lock is gone, or now
 * carries a different token, this is a no-op. The residual get→delete window is
 * a single microtask and only reachable exactly at the staleness boundary,
 * versus the old unconditional delete which fired on every slow takeover.
 */
export const releaseLock = async (
  env: Env,
  key: string,
  token: LockToken,
): Promise<void> => {
  const existing = await env.SCREENSHOTS_BUCKET.get(lockKey(key));
  if (existing === null) return; // already gone
  if ((await existing.text()) !== token) return; // superseded — not ours to delete
  await env.SCREENSHOTS_BUCKET.delete(lockKey(key));
};
