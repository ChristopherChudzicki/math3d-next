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
 * Returns a callback that transforms a mathItem into a callback mapping prop
 * names to mathScope node ids.
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

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const shortSleep = () => sleep(15);

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
const flatProduct = <T, U>(arr1: T[], arr2: U[]): (T & U)[] =>
  arr1.flatMap((obj1) => {
    return arr2.map((obj2) => ({ ...obj1, ...obj2 }));
  });

export {
  assertInstanceOf,
  nodeId,
  permutations,
  flatProduct,
  pasteText,
  sleep,
  userWaits,
  shortSleep,
  allowActWarnings,
};
