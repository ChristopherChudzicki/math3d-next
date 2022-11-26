import user from "@testing-library/user-event";
import { MathItem } from "@/configs";
import { mathScopeId } from "@/features/sceneControls/mathItems/mathScope";
import * as R from "ramda";
import { assertInstanceOf } from "@/util/predicates";
import { act } from "react-dom/test-utils";

const permutations = <T>(tokens: T[], subperms: T[][] = [[]]): T[][] =>
  R.isEmpty(tokens)
    ? subperms
    : tokens.flatMap((token: T, idx) =>
        permutations(R.remove(idx, 1, tokens), R.map(R.append(token), subperms))
      );

/**
 * Helps transform a mathItem's property names into MathScope node ids.
 *
 * Returns `propName => <nodeId for prop value>`
 *
 */
const nodeId =
  <T extends MathItem>(item: T) =>
  (propName: keyof T["properties"] & string) =>
    mathScopeId(item.id, propName);

const pasteText = (element: HTMLElement, text: string) => {
  user.clear(element);
  user.click(element);
  return user.paste(text);
};

const sleep = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const userWaits = (ms: number, { useFake = false } = {}) =>
  act(() => {
    if (useFake) {
      vi.advanceTimersByTime(ms);
      return Promise.resolve();
    }
    return sleep(ms);
  });

/**
 * Disable act warnings for a single test.
 *
 * Use sparingly.
 */
const allowActWarnings = () => {
  // eslint-disable-next-line no-console
  const consoleError = console.error;
  const patchedConsoleError: typeof consoleError = (...args) => {
    if (/not wrapped in act/.test(args[0])) return;
    consoleError(...args);
  };
  vi.spyOn(console, "error").mockImplementation(patchedConsoleError);
};

const flatProduct1 = <T, U>(arr1: T[], arr2: U[]): (T & U)[] =>
  arr1.flatMap((obj1) => {
    return arr2.map((obj2) => ({ ...obj1, ...obj2 }));
  });

/**
 * Returns the cartesian product of two object arrays, with objects flattened.
 *
 * @example
 * ```ts
 * const arr1 = [{ a: 1 }, { a: 2 }]
 * const arr2 = [{ b: 10 }, { b: 20 }]
 * const prod = flatProduct(arr1, arr2)
 * // [{ a: 1, b: 10 }, { a: 2, b: 10 }, { a: 1, b: 20 }, { a: 2, b: 20 }]
 * ```
 *
 * Particularly useful for jest testcases.
 */
function flatProduct<T1, T2>(arr1: T1[], arr2: T2[]): (T1 & T2)[];
function flatProduct<T1, T2, T3>(
  arr1: T1[],
  arr2: T2[],
  arr3: T3[]
): (T1 & T2 & T3)[];
function flatProduct<T1, T2, T3, T4>(
  arr1: T1[],
  arr2: T2[],
  arr3: T3[],
  arr4: T4[]
): (T1 & T2 & T3 & T4)[];

function flatProduct(...arrays: unknown[][]): unknown[] {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0];
  return arrays.reduce((acc, arr) => {
    return flatProduct1(acc, arr);
  });
}

export {
  assertInstanceOf,
  nodeId,
  permutations,
  flatProduct,
  pasteText,
  userWaits,
  allowActWarnings,
};
