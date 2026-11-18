import { isMatrix, isSymbolNode } from "mathjs";
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
 * mathjs's map transform, except that a user function gets the index and
 * collections only if it declares them, and a Matrix result is sized by its
 * data. mathjs passes `f(x)` the index and collection too, which a user
 * function rejects.
 */
const createUserMapTransform = ({
  map,
  matrix,
  mathjsTransform,
}: {
  map: Fn;
  matrix: (data: unknown) => unknown;
  mathjsTransform: RawArgsTransform;
}): RawArgsTransform => {
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
    // mathjs calls `limited` with n values, the index, then the n
    // collections. Every value is passed, so too few parameters still errors.
    const limited = (...received: unknown[]) => {
      const passed = received.slice(0, Math.max(arity, n));
      if (arity > n) {
        // mathjs's index counts from 0; expressions count from 1.
        passed[n] = (received[n] as number[]).map((i) => i + 1);
      }
      return f(...passed);
    };
    const result = map(...collections, limited);
    // DenseMatrix.map keeps the input's size even when f returns vectors;
    // rebuilding from the data recomputes it.
    return isMatrix(result) ? matrix(result.toArray()) : result;
  };
  return Object.assign(transform, { rawArgs: true as const });
};

export { createUserMapTransform };
export type { RawArgsTransform };
