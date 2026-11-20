import type { Column, Evaluate, Pool } from "./types";

const NONE = 0;
const TILED = 1;
const RUNS = 2;

/**
 * Finds, at each call of a compiled function, where its argument columns
 * repeat as a grid's do when its points are listed in order: the fastest
 * axis tiles with a period, a slower one comes in runs.
 *
 * Call `oncePerRepeat` for every subtree before `inspecting`, which decides
 * then which columns to inspect. What an inspection finds is valid only
 * while that call of `body` runs: a compiled function is never re-entered.
 */
export const createRepeats = (params: number) => {
  const inspected = new Array<boolean>(params).fill(false);
  const kind = new Uint8Array(params);
  /** The period, or the run length. */
  const size = new Int32Array(params);
  /**
   * Each run's value, for the parameters whose columns come in runs. Also the
   * argument list such a parameter's subtree gets: it reads only its own.
   */
  const runValues = new Array<Column>(params).fill(NaN);

  const inspect = (
    count: number,
    column: Float64Array,
    p: number,
    pool: Pool,
  ) => {
    const first = column[0];
    let run = 1;
    while (run < count && Object.is(column[run], first)) run += 1;
    if (run === 1) {
      // A period longer than half the column saves too little to look for.
      const longest = Math.floor(count / 2);
      let period = 1;
      while (period <= longest && !Object.is(column[period], first)) {
        period += 1;
      }
      if (period > longest) return;
      for (let i = period; i < count; i += 1) {
        if (!Object.is(column[i], column[i - period])) return;
      }
      kind[p] = TILED;
      size[p] = period;
      return;
    }
    const values = pool.take();
    values[0] = first;
    for (let start = run, j = 1; start < count; start += run, j += 1) {
      const value = column[start];
      const end = Math.min(start + run, count);
      for (let i = start + 1; i < end; i += 1) {
        if (!Object.is(column[i], value)) return;
      }
      values[j] = value;
    }
    kind[p] = RUNS;
    size[p] = run;
    runValues[p] = values;
  };

  return {
    /**
     * `subtree`, which reads only parameter `param`, evaluated once per entry
     * of the period or once per run when that parameter's column repeats,
     * then copied out to every sample.
     */
    oncePerRepeat: (subtree: Evaluate, param: number): Evaluate => {
      inspected[param] = true;
      return (count, args, pool) => {
        const length = size[param];
        if (kind[param] === TILED) {
          const values = subtree(length, args, pool);
          if (typeof values === "number") return values;
          // Not expanded in place: `values` can be the caller's column, which
          // isn't ours to write.
          const out = pool.take();
          for (let i = 0; i < length; i += 1) out[i] = values[i];
          for (let filled = length; filled < count; ) {
            const copied = Math.min(filled, count - filled);
            out.copyWithin(filled, 0, copied);
            filled += copied;
          }
          return out;
        }
        if (kind[param] === RUNS) {
          const runs = Math.ceil(count / length);
          const values = subtree(runs, runValues, pool);
          if (typeof values === "number") return values;
          const out = pool.take();
          for (let j = 0; j < runs; j += 1) {
            out.fill(values[j], j * length, Math.min((j + 1) * length, count));
          }
          return out;
        }
        return subtree(count, args, pool);
      };
    },

    /**
     * `body` with the columns it was given inspected first, for the
     * parameters `oncePerRepeat` was called with. Other columns are left
     * alone: inspecting one costs more than an arithmetic loop over it.
     */
    inspecting: (body: Evaluate): Evaluate => {
      if (!inspected.includes(true)) return body;
      return (count, args, pool) => {
        for (let p = 0; p < params; p += 1) {
          const column = args[p];
          kind[p] = NONE;
          if (inspected[p] && typeof column !== "number") {
            inspect(count, column, p, pool);
          }
        }
        return body(count, args, pool);
      };
    },
  };
};
