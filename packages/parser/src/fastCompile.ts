import math from "@math3d/custom-mathjs";
import type * as mjs from "mathjs";

/**
 * Compiles a mathjs tree to closures that agree with `node.compile()` but
 * sample faster: scope names and parameter-free subexpressions are read once
 * per evaluation, and all-number calls skip typed-function dispatch. Anything
 * unhandled is evaluated by mathjs.
 *
 * Reading the scope once is sound because MathScope re-evaluates an
 * expression when a name it uses changes.
 */

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

/** Arguments are positional, so a function with more parameters goes to mathjs. */
const MAX_PARAMS = 5;

const pickArgument: Closure[] = [
  (a) => a,
  (a, b) => b,
  (a, b, c) => c,
  (a, b, c, d) => d,
  (a, b, c, d, e) => e,
];

/** A subexpression that is the same for every call, or one that isn't. */
type Part =
  | { constant: true; value: unknown }
  | { constant: false; run: Closure };

const constant = (value: unknown): Part => ({ constant: true, value });
const dynamic = (run: Closure): Part => ({ constant: false, run });

const toClosure = (part: Part): Closure => {
  if (!part.constant) return part.run;
  const { value } = part;
  return () => value;
};

/** Thrown while building to hand the whole expression to mathjs. */
class Unsupported extends Error {}

const { mathWithTransform } = (
  math as unknown as {
    expression: { mathWithTransform: Record<string, unknown> };
  }
).expression;

const { typed } = math as unknown as {
  typed: {
    isTypedFunction(f: unknown): boolean;
    resolve(f: unknown, args: unknown[]): { implementation: Fn } | null;
  };
};

const asMatrix =
  (math.config as unknown as () => { matrix: string })().matrix !== "Array";

/** Whether mathjs refuses to read `name` from its tables of arguments and functions. */
const isUnsafeName = (name: string) =>
  name !== "length" &&
  name !== "name" &&
  (name in Object.prototype || name in Function.prototype);

const isPlainFunction = (value: unknown): value is Fn =>
  typeof value === "function" &&
  (value as { rawArgs?: boolean }).rawArgs !== true;

/** What `fn` dispatches to when its `arity` arguments are all numbers. */
const numberImplementation = (fn: Fn, arity: number): Fn | undefined =>
  typed.isTypedFunction(fn)
    ? typed.resolve(fn, Array(arity).fill(0))?.implementation
    : undefined;

const call = (fn: Fn, args: Part[]): Part => {
  if (args.every((arg) => arg.constant)) {
    try {
      const value = fn(...args.map((arg) => (arg as { value: unknown }).value));
      // Only numbers are folded: a folded array would be one object shared
      // by every call.
      if (typeof value === "number") return constant(value);
    } catch {
      // Thrown again at each call, as mathjs does.
    }
  }
  const closures = args.map(toClosure);
  if (closures.length === 1) {
    const [arg0] = closures;
    const fast = numberImplementation(fn, 1);
    if (!fast) return dynamic((a, b, c, d, e) => fn(arg0(a, b, c, d, e)));
    return dynamic((a, b, c, d, e) => {
      const u = arg0(a, b, c, d, e);
      return typeof u === "number" ? fast(u) : fn(u);
    });
  }
  if (closures.length === 2) {
    const [arg0, arg1] = closures;
    const fast = numberImplementation(fn, 2);
    if (!fast) {
      return dynamic((a, b, c, d, e) =>
        fn(arg0(a, b, c, d, e), arg1(a, b, c, d, e)),
      );
    }
    return dynamic((a, b, c, d, e) => {
      const u = arg0(a, b, c, d, e);
      const v = arg1(a, b, c, d, e);
      return typeof u === "number" && typeof v === "number"
        ? fast(u, v)
        : fn(u, v);
    });
  }
  return dynamic((a, b, c, d, e) =>
    fn(...closures.map((arg) => arg(a, b, c, d, e))),
  );
};

/**
 * Builds the parts of a function with these `params`, or of a value when
 * there are none. `self` is the function's own name.
 */
const builder = (params: string[], scope: Scope, self?: string) => {
  /** What `name` means outside the parameters: the scope's value, else mathjs's. */
  const lookup = (name: string): unknown => {
    // mathjs has a function see itself; the scope holds only its predecessor.
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
      return call(fn, node.args.map(build));
    }
    if (math.isFunctionNode(node)) {
      if (!math.isSymbolNode(node.fn)) throw new Unsupported();
      if (params.includes(node.fn.name)) throw new Unsupported();
      const fn = lookup(node.fn.name);
      if (!isPlainFunction(fn)) throw new Unsupported();
      return call(fn, node.args.map(build));
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

const evaluate = (node: mjs.MathNode, scope: Scope): unknown => {
  if (math.isFunctionAssignmentNode(node)) {
    const { params, name } = node;
    if (params.length > MAX_PARAMS) throw new Unsupported();
    if (params.some(isUnsafeName)) throw new Unsupported();
    return toClosure(builder(params, scope, name)(node.expr));
  }
  let expr = node;
  if (math.isAssignmentNode(node)) {
    if (!math.isSymbolNode(node.object) || node.index) throw new Unsupported();
    expr = node.value;
  }
  return toClosure(builder([], scope)(expr))();
};

/**
 * A stand-in for `node.compile()`, with two differences. A function
 * assignment evaluates to a function that takes its arguments as given: it
 * checks neither their number nor their types. And an assignment is not
 * written to the scope.
 */
const fastCompile = (
  node: mjs.MathNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): { evaluate: (scope?: Scope) => any } => {
  // Up front, since compiling is where mathjs rejects some expressions, such
  // as an operator this instance lacks.
  const compiled = node.compile();
  return {
    evaluate: (scope = new Map()) => {
      try {
        return evaluate(node, scope);
      } catch (err) {
        if (!(err instanceof Unsupported)) throw err;
      }
      return compiled.evaluate(scope);
    },
  };
};

export { fastCompile, numberImplementation };
