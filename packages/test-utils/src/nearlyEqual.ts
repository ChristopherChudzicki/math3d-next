import { getType } from "jest-get-type";

/**
 * Generates nSample random real numbers between min and max
 */
function randomReals(min: number, max: number, nSamples: number) {
  return Array.from({ length: nSamples }).map(() => {
    return min + (max - min) * Math.random();
  });
}

/**
 * generates nSamples random samples, each sample is an array of length
 * sampleLength
 */
function genSamples(
  min: number,
  max: number,
  nSamples: number,
  sampleLength: number
) {
  return Array.from({ length: nSamples }).map(() => {
    return randomReals(min, max, sampleLength);
  });
}

type ToNearlyEqualOptions = {
  digitsToCompare: number;
  nSamples: number;
  range: [number, number];
};

/**
 * recursively checks whether a and b are nearly equal:
 *   - for numbers, approximate equality
 *   - for functions, approximate equal at random samples
 *   - for arrays/objects, approximate equality of all keys
 *   - fallback to strict equality === as default case
 */
const isNearlyEqual = (
  a: unknown,
  b: unknown,
  opts: ToNearlyEqualOptions
): boolean => {
  const { digitsToCompare, nSamples, range } = opts;

  if (getType(a) !== getType(b)) {
    return false;
  }

  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) <= 10 ** -digitsToCompare;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, index) => isNearlyEqual(item, b[index], opts))
    );
  }

  if (typeof a === "function" && typeof b === "function") {
    // by using max arity, we allow that functions of different arity might be
    // nearly equal. For example, x => 5 and (x, y) => 5
    const arity = Math.max(a.length, b.length);
    const [min, max] = range;
    const samples = genSamples(min, max, nSamples, arity);
    return isNearlyEqual(
      samples.map((sample) => a(...sample)),
      samples.map((sample) => b(...sample)),
      opts
    );
  }

  if (getType(a) === "object" && getType(b) === "object") {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(a as object).sort();
    const bKeys = Object.keys(b as object).sort();

    if (aKeys.length !== bKeys.length) {
      return false;
    }
    const keysAreSame = aKeys.every((key, index) => key === bKeys[index]);
    return (
      keysAreSame &&
      aKeys.every((key) => isNearlyEqual(aObj[key] as unknown, bObj[key], opts))
    );
  }
  return a === b;
};

const toNearlyEqual = (
  received: unknown,
  expected: unknown,
  opts: Partial<ToNearlyEqualOptions> = {}
) => {
  const { nSamples = 5, digitsToCompare = 6, range = [1, 3] } = opts;
  const pass = isNearlyEqual(received, expected, {
    nSamples,
    digitsToCompare,
    range,
  });

  return {
    pass,
    message: () => `Not nearly equal using options: ${JSON.stringify(opts)}`,
    actual: received,
    expected,
  };
};

interface CustomMatchers {
  toNearlyEqual: (
    expected: unknown,
    opts?: Partial<ToNearlyEqualOptions>
  ) => void;
}

export { toNearlyEqual };
export type { CustomMatchers, ToNearlyEqualOptions };
