import { isMatrix } from "mathjs";

type UserFunctionSignature = { name: string; params: string[] };

// Keyed by function identity: typed functions and the wrappers around them
// all report length 2, so length can't tell a user function's arity.
const signatures = new WeakMap<object, UserFunctionSignature>();

/** Marks `f` as a user function, which a lone point may be spread into. */
const setUserFunctionSignature = (
  f: object,
  signature: UserFunctionSignature,
) => {
  signatures.set(f, signature);
};

const getUserFunctionSignature = (
  f: unknown,
): UserFunctionSignature | undefined =>
  typeof f === "function" ? signatures.get(f) : undefined;

const isScalar = (x: unknown) => !Array.isArray(x) && !isMatrix(x);

/** The entries of an array or Matrix of scalars, or undefined. */
const vectorEntries = (x: unknown): unknown[] | undefined => {
  const entries = isMatrix(x) ? x.toArray() : x;
  return Array.isArray(entries) && entries.every(isScalar)
    ? entries
    : undefined;
};

/** A lone vector's entries when `n ≥ 2` of them are wanted; else `args`. */
const spreadVector = (n: number, args: unknown[]): unknown[] => {
  if (n < 2 || args.length !== 1) return args;
  const entries = vectorEntries(args[0]);
  return entries?.length === n ? entries : args;
};

/** `args` as user function `f` takes them: a lone point becomes its coordinates. */
const spreadPoint = (f: unknown, args: unknown[]): unknown[] => {
  const signature = getUserFunctionSignature(f);
  return signature ? spreadVector(signature.params.length, args) : args;
};

export {
  getUserFunctionSignature,
  setUserFunctionSignature,
  spreadPoint,
  spreadVector,
  vectorEntries,
};
export type { UserFunctionSignature };
