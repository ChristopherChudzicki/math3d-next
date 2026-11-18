import { isSymbolNode } from "mathjs";
import type { MathNode, MathScope } from "mathjs";
import { getUserFunctionSignature } from "./userFunctions";

type Fn = (...args: unknown[]) => unknown;

/** A transform that receives its arguments as unevaluated nodes. */
type RawArgsTransform = ((
  args: MathNode[],
  math: unknown,
  scope: MathScope,
) => unknown) & { rawArgs: true };

/**
 * mathjs's map transform, except that a user function gets only the
 * arguments it declares: mathjs passes it the index and collections too,
 * whatever its arity, and a user function rejects extra arguments.
 */
const createUserMapTransform = (
  map: Fn,
  mathjsTransform: RawArgsTransform,
): RawArgsTransform => {
  const transform = (args: MathNode[], math: unknown, scope: MathScope) => {
    const last = args[args.length - 1];
    const callback = isSymbolNode(last)
      ? (last.compile().evaluate(scope) as unknown)
      : undefined;
    const signature = getUserFunctionSignature(callback);
    if (!signature) return mathjsTransform(args, math, scope);
    const f = callback as Fn;
    const collections = args
      .slice(0, -1)
      .map((arg) => arg.compile().evaluate(scope) as unknown);
    const arity = signature.params.length;
    const n = collections.length;
    // The callback receives n values, the index, then the n collections.
    // Every value is passed, so too few parameters is still an error.
    const limited = (...received: unknown[]) => {
      const passed = received.slice(0, Math.max(arity, n));
      if (arity > n) {
        // mathjs's index counts from 0; expressions count from 1.
        passed[n] = (received[n] as number[]).map((i) => i + 1);
      }
      return f(...passed);
    };
    // mathjs may read `length` to decide what to pass; 2n + 1 asks for the
    // index and collections.
    Object.defineProperty(limited, "length", { value: 2 * n + 1 });
    return map(...collections, limited);
  };
  return Object.assign(transform, { rawArgs: true as const });
};

export { createUserMapTransform };
export type { RawArgsTransform };
