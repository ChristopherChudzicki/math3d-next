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

/** A subexpression over a function's argument columns. */
export type Evaluate = (count: number, args: Column[], pool: Pool) => Column;

/** A function of numbers that returns a number, or one number per component. */
export type Compiled =
  | { params: number; evaluate: Evaluate }
  | { params: number; components: Evaluate[] };

/** The batched form of a function of `params` numbers that returns a number. */
export type BatchForm = {
  params: number;
  /**
   * One result per sample, or `undefined` when it declines. Never throws.
   * Read-only, and overwritten by this form's next `run`.
   */
  run: (count: number, ...args: Column[]) => Float64Array | undefined;
};

/** The batched form of a function of `params` numbers that returns `size` numbers. */
export type VectorBatchForm = {
  params: number;
  size: number;
  /**
   * One array per component, each with one entry per sample, or `undefined`
   * when it declines. Never throws. Read-only, and overwritten by this
   * form's next `run`.
   */
  run: (count: number, ...args: Column[]) => Float64Array[] | undefined;
};
