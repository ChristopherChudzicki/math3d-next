import type { Pool } from "./types";

export const createPool = (): Pool => {
  let arrays: Float64Array[] = [];
  let length = 0;
  let next = 0;
  return {
    reset: (count) => {
      if (count !== length) {
        arrays = [];
        length = count;
      }
      next = 0;
    },
    take: () => {
      if (next === arrays.length) arrays.push(new Float64Array(length));
      const array = arrays[next];
      next += 1;
      return array;
    },
  };
};
