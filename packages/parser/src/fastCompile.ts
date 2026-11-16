import math, { mathWithTransform, typed } from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";

type Scope = mjs.MapLike<string, unknown>;

type Fn = (...args: unknown[]) => unknown;

/** A subexpression's value, given the enclosing function's arguments. */
type Closure = (
  a?: unknown,
  b?: unknown,
  c?: unknown,
  d?: unknown,
  e?: unknown,
) => unknown;

const pickArgument: Closure[] = [
  (a) => a,
  (a, b) => b,
  (a, b, c) => c,
  (a, b, c, d) => d,
  (a, b, c, d, e) => e,
];

/** A closure has this many argument slots; a longer function goes to mathjs. */
const MAX_PARAMS = pickArgument.length;

/** A subexpression that is the same for every call, or one that isn't. */
type Constant = { constant: true; value: unknown };
type Part = Constant | { constant: false; run: Closure };

const constant = (value: unknown): Part => ({ constant: true, value });
const dynamic = (run: Closure): Part => ({ constant: false, run });
const isConstant = (part: Part): part is Constant => part.constant;

const toClosure = (part: Part): Closure => {
  if (!part.constant) return part.run;
  const { value } = part;
  return () => value;
};

/** Thrown while building to hand the whole expression to mathjs. */
class Unsupported extends Error {}

const asMatrix =
  (math.config as unknown as () => { matrix: string })().matrix !== "Array";

/** Whether mathjs refuses to read `name` from its tables of arguments and functions. */
const isUnsafeName = (name: string) => name in Object.prototype;

const isPlainFunction = (value: unknown): value is Fn =>
  typeof value === "function" &&
  (value as { rawArgs?: boolean }).rawArgs !== true;

/** What `fn` dispatches to when its `arity` arguments are all numbers. */
const numberImplementation = (fn: Fn, arity: number): Fn | undefined =>
  typed.isTypedFunction(fn)
    ? typed.resolve(fn, Array(arity).fill(0))?.implementation
    : undefined;

/** Whether `x` is an array holding only numbers, so one with no nesting. */
const isNumbers = (x: unknown): x is number[] => {
  if (!Array.isArray(x)) return false;
  for (let i = 0; i < x.length; i += 1) {
    if (typeof x[i] !== "number") return false;
  }
  return true;
};

/**
 * The entries of a vector of numbers: the array itself, or a matrix's own,
 * not a copy. A matrix with a datatype is left to mathjs, which converts
 * operands and results to that type.
 */
const numbersOf = (x: unknown): number[] | undefined => {
  if (!math.isMatrix(x)) return isNumbers(x) ? x : undefined;
  if (x.datatype() !== undefined) return undefined;
  const data = x.valueOf();
  return isNumbers(data) ? data : undefined;
};

/** `entries` as mathjs returns them for an operation on `operands`. */
const vectorLike = (entries: number[], ...operands: unknown[]) =>
  operands.some(math.isMatrix) ? math.matrix(entries) : entries;

type VectorShapes = {
  numberVector?: true;
  vectorNumber?: true;
  vectorVector?: true;
};
/**
 * The operand shapes, beyond two numbers, for which mathjs applies an
 * operator entry by entry. Two vectors must be the same length: mathjs
 * broadcasts a one-entry vector. Vector × vector is a dot product, and
 * number / vector an inverse.
 */
const VECTOR_SHAPES = new Map<unknown, VectorShapes>([
  [
    mathWithTransform.add,
    { numberVector: true, vectorNumber: true, vectorVector: true },
  ],
  [
    mathWithTransform.subtract,
    { numberVector: true, vectorNumber: true, vectorVector: true },
  ],
  [mathWithTransform.multiply, { numberVector: true, vectorNumber: true }],
  [mathWithTransform.divide, { vectorNumber: true }],
]);

/**
 * `fn` of two operands that aren't both numbers: `numberFn` entry by entry
 * for vectors of numbers in one of `shapes`, else mathjs's `fn`.
 */
const vectorCall =
  (fn: Fn, numberFn: Fn, shapes: VectorShapes) => (u: unknown, v: unknown) => {
    const xs = typeof u === "number" ? undefined : numbersOf(u);
    const ys = typeof v === "number" ? undefined : numbersOf(v);
    let out: number[] | undefined;
    if (typeof u === "number" && ys && shapes.numberVector) {
      out = new Array(ys.length);
      for (let i = 0; i < ys.length; i += 1) {
        out[i] = numberFn(u, ys[i]) as number;
      }
    } else if (xs && typeof v === "number" && shapes.vectorNumber) {
      out = new Array(xs.length);
      for (let i = 0; i < xs.length; i += 1) {
        out[i] = numberFn(xs[i], v) as number;
      }
    } else if (xs && ys && xs.length === ys.length && shapes.vectorVector) {
      out = new Array(xs.length);
      for (let i = 0; i < xs.length; i += 1) {
        out[i] = numberFn(xs[i], ys[i]) as number;
      }
    }
    return out ? vectorLike(out, u, v) : fn(u, v);
  };

/** Told the name of each mathjs function a sample calls through its dispatch. */
type OnDispatch = (name: string) => void;

const call = (fn: Fn, args: Part[], onDispatch?: OnDispatch): Part => {
  if (args.every(isConstant)) {
    try {
      const value = fn(...args.map((arg) => arg.value));
      // Only numbers are folded: a folded array would be one object shared
      // by every call.
      if (typeof value === "number") return constant(value);
    } catch {
      // Thrown again at each call, as mathjs does.
    }
  }
  // What a sample calls when no fast path takes its arguments.
  const slow: Fn =
    onDispatch && typed.isTypedFunction(fn)
      ? (...operands) => {
          onDispatch(fn.name);
          return fn(...operands);
        }
      : fn;
  const closures = args.map(toClosure);
  if (closures.length === 1) {
    const [arg0] = closures;
    const fast = numberImplementation(fn, 1);
    if (!fast) return dynamic((a, b, c, d, e) => slow(arg0(a, b, c, d, e)));
    return dynamic((a, b, c, d, e) => {
      const u = arg0(a, b, c, d, e);
      return typeof u === "number" ? fast(u) : slow(u);
    });
  }
  if (closures.length === 2) {
    const [arg0, arg1] = closures;
    if (fn === mathWithTransform.pow) {
      const [, exponent] = args;
      if (exponent.constant && Number.isInteger(exponent.value)) {
        // mathjs's number `pow` is `Math.pow` when the exponent is whole.
        const n = exponent.value as number;
        return dynamic((a, b, c, d, e) => {
          const u = arg0(a, b, c, d, e);
          return typeof u === "number" ? u ** n : slow(u, n);
        });
      }
    }
    const fast = numberImplementation(fn, 2);
    if (!fast) {
      return dynamic((a, b, c, d, e) =>
        slow(arg0(a, b, c, d, e), arg1(a, b, c, d, e)),
      );
    }
    const shapes = VECTOR_SHAPES.get(fn);
    const other = shapes ? vectorCall(slow, fast, shapes) : slow;
    return dynamic((a, b, c, d, e) => {
      const u = arg0(a, b, c, d, e);
      const v = arg1(a, b, c, d, e);
      return typeof u === "number" && typeof v === "number"
        ? fast(u, v)
        : other(u, v);
    });
  }
  return dynamic((a, b, c, d, e) =>
    slow(...closures.map((arg) => arg(a, b, c, d, e))),
  );
};

/**
 * Builds the parts of a function with these `params`, or of a value when
 * there are none. `self` is the function's own name.
 */
const builder = (
  params: string[],
  scope: Scope,
  self?: string,
  onDispatch?: OnDispatch,
) => {
  /** What `name` means outside the parameters: the scope's value, else mathjs's. */
  const lookup = (name: string): unknown => {
    // mathjs resolves `self` to the function being defined; the scope holds
    // an earlier definition.
    if (name === self || isUnsafeName(name)) throw new Unsupported();
    if (scope.has(name)) return scope.get(name);
    if (Object.hasOwn(mathWithTransform, name)) return mathWithTransform[name];
    throw new Unsupported();
  };

  const build = (node: mjs.MathNode): Part => {
    if (math.isConstantNode(node)) return constant(node.value);
    if (math.isParenthesisNode(node)) return build(node.content);
    if (math.isSymbolNode(node)) {
      const index = params.indexOf(node.name);
      return index >= 0
        ? dynamic(pickArgument[index])
        : constant(lookup(node.name));
    }
    if (math.isOperatorNode(node)) {
      // Operators come from mathjs, never the scope.
      const fn = Object.hasOwn(mathWithTransform, node.fn)
        ? mathWithTransform[node.fn]
        : undefined;
      if (!isPlainFunction(fn)) throw new Unsupported();
      return call(fn, node.args.map(build), onDispatch);
    }
    if (math.isFunctionNode(node)) {
      if (!math.isSymbolNode(node.fn)) throw new Unsupported();
      if (params.includes(node.fn.name)) throw new Unsupported();
      const fn = lookup(node.fn.name);
      if (!isPlainFunction(fn)) throw new Unsupported();
      return call(fn, node.args.map(build), onDispatch);
    }
    if (math.isArrayNode(node)) {
      const items = node.items.map(build).map(toClosure);
      return dynamic((a, b, c, d, e) => {
        const values = new Array(items.length);
        for (let i = 0; i < items.length; i += 1) {
          values[i] = items[i](a, b, c, d, e);
        }
        return asMatrix ? math.matrix(values) : values;
      });
    }
    throw new Unsupported();
  };
  return build;
};

const evaluate = (
  node: mjs.MathNode,
  scope: Scope,
  onDispatch?: OnDispatch,
): unknown => {
  if (math.isFunctionAssignmentNode(node)) {
    const { params, name } = node;
    if (params.length > MAX_PARAMS) throw new Unsupported();
    if (params.some(isUnsafeName)) throw new Unsupported();
    return toClosure(builder(params, scope, name, onDispatch)(node.expr));
  }
  let expr = node;
  if (math.isAssignmentNode(node)) {
    if (!math.isSymbolNode(node.object) || node.index) throw new Unsupported();
    expr = node.value;
  }
  return toClosure(builder([], scope, undefined, onDispatch)(expr))();
};

/**
 * A stand-in for `node.compile()` that samples faster, except that:
 * - scope names, and parameter-free subexpressions with number values, are
 *   read once per `evaluate`, not per call. MathScope re-evaluates an
 *   expression when a name it uses changes, so this is safe there;
 * - a function assignment evaluates to a plain function with no arity check;
 * - an assignment is not written to the scope.
 * An expression with anything unhandled is evaluated entirely by mathjs.
 *
 * `onDispatch` is for tests: results can't show whether a call took a fast
 * path, since mathjs's dispatch gives the same ones.
 */
const fastCompile = (
  node: mjs.MathNode,
  { onDispatch }: { onDispatch?: OnDispatch } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { evaluate: (scope?: Scope) => any } => {
  // Up front, since compiling is where mathjs rejects some expressions, such
  // as an operator this instance lacks.
  const compiled = node.compile();
  return {
    evaluate: (scope = new Map()) => {
      try {
        return evaluate(node, scope, onDispatch);
      } catch (err) {
        if (!(err instanceof Unsupported)) throw err;
      }
      return compiled.evaluate(scope);
    },
  };
};

export { fastCompile, numbersOf };
