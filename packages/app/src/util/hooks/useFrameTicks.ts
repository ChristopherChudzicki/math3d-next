import { useEffect, useRef } from "react";

/**
 * Calls `onTicks(elapsed)` on animation frames, on average `fps` times per
 * second. `elapsed` is the time since the previous call in units of 1/fps,
 * so advancing by `elapsed * step` moves at a steady rate however the calls
 * land on frames. `null` stops.
 */
const useFrameTicks = (
  onTicks: (elapsed: number) => void,
  fps: number | null,
) => {
  const cbRef = useRef(onTicks);
  cbRef.current = onTicks;
  useEffect(() => {
    if (fps === null || !Number.isFinite(fps) || fps <= 0) return () => {};
    const periodMs = 1000 / fps;
    // Frame times jitter around the display's period, so a frame due exactly
    // one period later can arrive a fraction of a millisecond early.
    const slack = periodMs / 10;
    let prev: number | null = null;
    let due = 0;
    let id = requestAnimationFrame(function frame(now) {
      // After a gap over a second (e.g. a background tab pauses frames),
      // resume from here rather than jumping ahead.
      if (prev === null || now - prev > 1000 + periodMs) {
        prev = now;
        due = now + periodMs;
      } else if (now + slack >= due) {
        const elapsed = (now - prev) / periodMs;
        prev = now;
        // Next due time: past `now` by whole periods, keeping the phase.
        due += periodMs * (Math.floor((now + slack - due) / periodMs) + 1);
        cbRef.current(elapsed);
      }
      id = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(id);
  }, [fps]);
};

export { useFrameTicks };
