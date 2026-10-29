/**
 * Legacy audit, pass 2: reduces an evaluated value to JSON
 * (docs/legacy-audit/2026-10-29-pass2-spec.md, "Fingerprints").
 *
 * math3d-react's evaluator (client/src/legacyAudit/evaluate.audit.js) has its
 * own copy of this; both must pass fingerprint_cases.json. Matrices and
 * complex numbers are recognised by mathjs's `isMatrix` / `isComplex`
 * prototype flags, so neither copy depends on its app's mathjs instance.
 */
import samplePoints from "../sample_points.json";

type Fingerprint =
  | number
  | { nonfinite: "NaN" | "Infinity" | "-Infinity" }
  | { re: Fingerprint; im: Fingerprint }
  | { bool: boolean }
  | { str: string }
  | { undefined: true }
  | { error: true }
  | { other: string }
  | Fingerprint[]
  | {
      fn: number;
      at: Fingerprint[] | null;
      // Present when every scalar point errors: points with vector arguments
      // of length 2 and 3, for functions like f(P) = P[1]·P[2].
      vec?: { 2: Fingerprint[]; 3: Fingerprint[] };
    };

const POINTS: Record<string, number[][]> = samplePoints;
const MAX_DEPTH = 2;
const NESTED_POINTS = 4;

const isError = (fp: Fingerprint) =>
  typeof fp === "object" && fp !== null && "error" in fp;

const number = (x: number): Fingerprint => {
  if (Number.isFinite(x)) return x;
  if (Number.isNaN(x)) return { nonfinite: "NaN" };
  return { nonfinite: x > 0 ? "Infinity" : "-Infinity" };
};

const call = (
  f: (...args: unknown[]) => unknown,
  args: unknown[],
  depth: number,
): Fingerprint => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return fingerprint(f(...args), depth + 1);
  } catch {
    return { error: true };
  }
};

const sampleFunction = (
  f: (...args: unknown[]) => unknown,
  depth: number,
): Fingerprint => {
  const arity = f.length;
  const points = POINTS[String(arity)];
  if (!points || depth >= MAX_DEPTH) return { fn: arity, at: null };
  const used = depth === 0 ? points : points.slice(0, NESTED_POINTS);
  const at = used.map((p) => call(f, p, depth));
  if (arity === 0 || !at.every(isError)) return { fn: arity, at };
  const withVectors = (length: 2 | 3) =>
    used.map((_p, j) =>
      call(
        f,
        Array.from(
          { length: arity },
          // A copy: index assignment mutates an array in place.
          (_a, i) => [...POINTS[length][(j + i) % POINTS[length].length]],
        ),
        depth,
      ),
    );
  return { fn: arity, at, vec: { 2: withVectors(2), 3: withVectors(3) } };
};

const fingerprint = (value: unknown, depth = 0): Fingerprint => {
  if (typeof value === "number") return number(value);
  if (typeof value === "boolean") return { bool: value };
  if (typeof value === "string") return { str: value };
  if (value === undefined) return { undefined: true };
  if (typeof value === "function") {
    return sampleFunction(value as (...args: unknown[]) => unknown, depth);
  }
  if (Array.isArray(value)) return value.map((v) => fingerprint(v, depth));
  if (typeof value === "object" && value !== null) {
    const v = value as {
      isMatrix?: boolean;
      isComplex?: boolean;
      toArray?: () => unknown[];
      re?: number;
      im?: number;
    };
    if (v.isMatrix && v.toArray) return fingerprint(v.toArray(), depth);
    if (v.isComplex) return { re: number(v.re!), im: number(v.im!) };
  }
  return {
    other:
      value === null
        ? "null"
        : (value as object).constructor?.name || typeof value,
  };
};

export { fingerprint, POINTS };
export type { Fingerprint };
