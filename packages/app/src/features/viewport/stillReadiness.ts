// `still`-mode readiness: deciding when a warming-up mathbox scene has settled
// enough to screenshot. Extracted as a pure state machine (no rAF, no mathbox)
// so the branching — which is subtle — can be unit-tested against synthetic
// sample sequences. `Scene.tsx` drives it once per animation frame.
//
// mathbox drains its warmup queue a couple objects per frame, so a fixed frame
// count under-renders any scene with more objects than the count covers (e.g. a
// 40-object scene needs ~20 frames; at 10 it screenshots half-drawn). Instead we
// poll `getPending()` and halt once the queue has stayed empty for a short while
// — scaling with scene complexity, and (since it keys off drain state, not a
// frame count) unaffected by the slow software-GL the headless screenshotter
// runs on.
//
// mathbox-react builds the scene tree in more than one React commit (a
// child-before-parent `forceUpdate` cascade under the pre-1.0 passive-effect
// build), and the browser runs warmup frames between those commits. So
// `getPending()` is NOT necessarily monotonic: it can drain to 0 between commit
// bursts before the next burst enqueues the rest (measured: 2 -> 0 -> 8 -> 36
// for a ~40-object scene). That transient zero is why we can't halt on the first
// empty frame. We gate on WALL-CLOCK quiescence rather than a frame count because
// the transient window is made of cheap idle frames (~8ms, independent of GL
// speed): a few frames barely outlast it, but a few hundred milliseconds clears
// it with margin on any hardware, including Cloudflare's slower vCPUs.
export const STILL_QUIET_MS = 500; // queue must stay empty this long to count as drained
export const STILL_MAX_FRAMES = 300; // frame-based backstop so we never spin forever
export const STILL_FALLBACK_FRAMES = 30; // used only if `getPending` is unavailable

export type DrainState = {
  /** Animation frames observed so far. */
  frame: number;
  /** Timestamp of the last frame the queue was seen non-empty. */
  lastNonEmpty: number;
  /** Whether the queue has ever been observed non-empty (the halt guard). */
  sawPending: boolean;
};

export const initDrainState = (now: number): DrainState => ({
  frame: 0,
  lastNonEmpty: now,
  sawPending: false,
});

/**
 * Advance the drain machine by one animation frame.
 *
 * @param pending warmup-queue depth this frame, or `null` if `getPending` is
 *   unavailable (then we fall back to a fixed frame count).
 * @returns the next state and whether the scene has settled enough to halt.
 *
 * `sawPending` guards against halting before any object has been queued: an
 * empty queue only counts as "drained" once we've seen it non-empty at least
 * once. The consequence is that a scene whose queue is never observed non-empty
 * (instant drain, or nothing async to warm up) exits only via the
 * `STILL_MAX_FRAMES` backstop — acceptable because real scenes carry
 * axes/grid/camera and are observed pending on the slow hardware this targets.
 */
export const stepDrain = (
  state: DrainState,
  { pending, now }: { pending: number | null; now: number },
): { state: DrainState; ready: boolean } => {
  const frame = state.frame + 1;
  let { lastNonEmpty, sawPending } = state;
  if (pending !== null && pending > 0) {
    sawPending = true;
    lastNonEmpty = now;
  }
  const drained =
    pending !== null
      ? sawPending && now - lastNonEmpty >= STILL_QUIET_MS
      : frame >= STILL_FALLBACK_FRAMES;
  return {
    state: { frame, lastNonEmpty, sawPending },
    ready: drained || frame >= STILL_MAX_FRAMES,
  };
};
