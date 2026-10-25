import { useEffect, useRef } from "react";

/**
 * Calls `onTicks(elapsed)` on animation frames: on average `fps` times per
 * second, or every frame when the display is slower than that. `elapsed` is
 * the time since the previous call in units of 1/fps, so advancing by
 * `elapsed * step` moves at a steady rate however the calls land on frames.
 * `null`, or an `fps` that isn't a positive number, stops.
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
    // A hidden tab gets no frames; resume from where it reappears rather than
    // jumping ahead.
    const restart = () => {
      prev = null;
    };
    document.addEventListener("visibilitychange", restart);
    let id = requestAnimationFrame(function frame(now) {
      if (prev === null) {
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
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener("visibilitychange", restart);
    };
  }, [fps]);
};

export { useFrameTicks };
