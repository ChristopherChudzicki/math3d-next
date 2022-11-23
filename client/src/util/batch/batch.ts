import { assertInstanceOf } from "../predicates";
import { IBatchError } from "./interfaces";

class BatchError extends Error implements IBatchError {
  errors: Record<number, Error> = {};

  constructor(errors: Record<number, Error>) {
    const [e] = Object.values(errors);
    super(e.message);
    this.errors = errors;
  }
}

/**
 * Like Array.map, but does not bail early on errors. All errors are calculated
 * and grouped in a BatchError.
 */
const batch = <T, R>(
  items: T[],
  cb: (item: T, i: number, arr: T[]) => R
): R[] => {
  const itemErrors: Record<number, Error> = {};
  const results = items.map((item, i, arr) => {
    try {
      return cb(item, i, arr);
    } catch (err) {
      assertInstanceOf(err, Error);
      itemErrors[i] = err;
      return undefined;
    }
  });
  if (Object.keys(itemErrors).length > 0) {
    throw new BatchError(itemErrors);
  }
  return results as R[];
};

const isBatchError = (e: unknown): e is IBatchError => {
  if (e instanceof BatchError) return true;
  if (!(e instanceof Error)) return false;
  const { errors } = e as Error & { errors?: unknown };
  if (!errors) return false;
  return Object.entries(errors).every(([k, v]) => {
    return +k >= 0 && v instanceof Error;
  });
};

export { BatchError, batch, isBatchError };
