import { test, expect } from "vitest";
import {
  initDrainState,
  stepDrain,
  STILL_QUIET_MS,
  STILL_MAX_FRAMES,
  STILL_FALLBACK_FRAMES,
} from "./stillReadiness";

type Sample = { pending: number | null; now: number };

/** `ready` flag produced at each frame, driving stepDrain over a sequence. */
const runReady = (startNow: number, samples: Sample[]): boolean[] => {
  let state = initDrainState(startNow);
  return samples.map((sample) => {
    const result = stepDrain(state, sample);
    state = result.state;
    return result.ready;
  });
};

/** Index of the first frame that reports ready, or -1 if it never does. */
const firstReady = (startNow: number, samples: Sample[]): number =>
  runReady(startNow, samples).indexOf(true);

test("halts once the queue has been empty for STILL_QUIET_MS", () => {
  const samples: Sample[] = [
    { pending: 5, now: 0 }, // last non-empty at t=0
    { pending: 0, now: STILL_QUIET_MS - 1 }, // not quiet long enough
    { pending: 0, now: STILL_QUIET_MS }, // quiet ≥ threshold → ready
  ];
  expect(firstReady(0, samples)).toBe(2);
});

test("waits through the transient zero between commit bursts, not halting early", () => {
  // The measured 2 → 0 → 8 → 36 sequence: a brief empty frame appears before
  // the second burst enqueues the rest of the scene.
  const samples: Sample[] = [
    { pending: 2, now: 0 },
    { pending: 0, now: 20 }, // transient zero — must NOT count as drained
    { pending: 8, now: 40 },
    { pending: 36, now: 60 },
    { pending: 4, now: 100 }, // last non-empty at t=100
    { pending: 0, now: 100 + STILL_QUIET_MS - 1 },
    { pending: 0, now: 100 + STILL_QUIET_MS }, // ready only now
  ];
  const readys = runReady(0, samples);
  expect(readys[1]).toBe(false); // did not halt on the transient zero
  expect(readys.indexOf(true)).toBe(6);
});

test("does not halt while the queue has never been observed non-empty", () => {
  // sawPending guard: an empty queue that was never seen filling up must not
  // count as drained (guards against halting before the scene enqueues).
  const samples: Sample[] = Array.from({ length: 10 }, (_, i) => ({
    pending: 0,
    now: (i + 1) * 16,
  }));
  expect(runReady(0, samples).every((ready) => ready === false)).toBe(true);
});

test("falls back to the STILL_MAX_FRAMES backstop when pending is never seen", () => {
  const samples: Sample[] = Array.from(
    { length: STILL_MAX_FRAMES },
    (_, i) => ({
      pending: 0,
      now: (i + 1) * 16,
    }),
  );
  expect(firstReady(0, samples)).toBe(STILL_MAX_FRAMES - 1);
});

test("uses STILL_FALLBACK_FRAMES when getPending is unavailable (pending null)", () => {
  const samples: Sample[] = Array.from(
    { length: STILL_FALLBACK_FRAMES },
    () => ({ pending: null, now: 0 }),
  );
  expect(firstReady(0, samples)).toBe(STILL_FALLBACK_FRAMES - 1);
});
