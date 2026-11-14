/**
 * Load progress as the loading knot shows it. The page reports only which
 * stage the load is in; progress creeps toward each stage's cap on its own, so
 * the arc keeps growing while the page is too busy to report anything.
 */

/** Fetching the renderer's code, building the scene, or drawn. */
export type LoadStage = "fetching" | "building" | "done";

/** Where progress starts, and the cap it creeps toward, at each stage. */
const STAGES: Record<LoadStage, { floor: number; cap: number }> = {
  fetching: { floor: 0, cap: 0.35 },
  building: { floor: 0.4, cap: 0.92 },
  done: { floor: 1, cap: 1 },
};

/** Seconds for progress to cover ~63% of the gap to its cap. */
const CREEP = 1.5;
/** Per second, how much of the gap to progress the arc closes. */
const EASE_RATE = 8;
/**
 * The most the arc grows per second, as a fraction of the knot, so a jump in
 * progress doesn't fling its head around the knot.
 */
const MAX_GROWTH = 0.5;
/**
 * Seconds the knot takes to close once loaded, early in the loader's fade. The
 * outline thickens in place: growing the arc the rest of the way in that time
 * would whip its head around the knot.
 */
const FINISH = 0.12;

export type KnotProgress = {
  /** How far the arc has grown, 0 to 1. It stops growing once done. */
  shown: number;
  /** From 0 when the load is done to 1 when the knot is closed. */
  finish: number;
};

export const createKnotProgress = () => {
  let floor = 0;
  let cap = 0;
  let progress = 0;
  let shown = 0;
  let finish = 0;
  return {
    setStage: (stage: LoadStage) => {
      floor = Math.max(floor, STAGES[stage].floor);
      cap = Math.max(STAGES[stage].cap, floor);
      progress = Math.max(progress, floor);
    },
    /** Advances by `dt` seconds. */
    step: (dt: number): KnotProgress => {
      if (floor >= 1) finish = Math.min(1, finish + dt / FINISH);
      else {
        progress += (cap - progress) * (1 - Math.exp(-dt / CREEP));
        const eased = (progress - shown) * Math.min(1, dt * EASE_RATE);
        shown += Math.min(eased, MAX_GROWTH * dt);
      }
      return { shown, finish };
    },
  };
};
