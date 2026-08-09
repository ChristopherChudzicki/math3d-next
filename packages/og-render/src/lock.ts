import type { Env } from "./env";
import { lockKey } from "./keys";

/**
 * Atomic create-if-absent using R2's conditional put. `etagDoesNotMatch: "*"`
 * is the If-None-Match:* semantic — the put is a no-op (returns null) when the
 * object already exists, which is strongly consistent across colos (unlike KV).
 * This is the single-flight guarantee: exactly one concurrent caller writes the
 * lock and gets `true`.
 *
 * A crashed render leaves the lock object behind; an R2 lifecycle rule sweeping
 * the `og/lock/` prefix after 1 day is the backstop (provisioned in Task 7).
 */
export const acquireLock = async (env: Env, key: string): Promise<boolean> => {
  const created = await env.OG_BUCKET.put(lockKey(key), "1", {
    onlyIf: { etagDoesNotMatch: "*" },
  });
  return created !== null;
};

export const releaseLock = (env: Env, key: string): Promise<void> =>
  env.OG_BUCKET.delete(lockKey(key));
