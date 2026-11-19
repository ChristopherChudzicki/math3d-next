/** One number per sample; a plain number is the same at every sample. */
export type Column = number | Float64Array;

export type Pool = {
  /** Starts a top-level run of `count` samples: every array is free again. */
  reset: (count: number) => void;
  /** An array of exactly `count` entries that no other `take` in this run returned. */
  take: () => Float64Array;
};

/** Thrown inside a run to make it return `undefined`. */
export class Decline extends Error {}
