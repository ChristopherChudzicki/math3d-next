import user from "@testing-library/user-event";
import { MathItem } from "@math3d/mathitem-configs";
import { mathScopeId } from "@/features/sceneControls/mathItems/mathScope";
import { assertInstanceOf } from "@/util/predicates";
import { act } from "react";
import invariant from "tiny-invariant";

const permutations = <T>(tokens: T[], subperms: T[][] = [[]]): T[][] =>
  tokens.length === 0
    ? subperms
    : tokens.flatMap((token: T, idx) =>
        permutations(
          tokens.filter((_tok, i) => i !== idx),
          subperms.map((subperm) => [...subperm, token]),
        ),
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
  arr3: T3[],
): (T1 & T2 & T3)[];
function flatProduct<T1, T2, T3, T4>(
  arr1: T1[],
  arr2: T2[],
  arr3: T3[],
  arr4: T4[],
): (T1 & T2 & T3 & T4)[];

function flatProduct(...arrays: unknown[][]): unknown[] {
  if (arrays.length === 0) return [];
  if (arrays.length === 1) return arrays[0];
  return arrays.reduce((acc, arr) => {
    return flatProduct1(acc, arr);
  });
}

/**
 * Given an HTMLElement with an aria-describedby attribute, return the element
 * that describes it.
 *
 * This is particularly useful with `@testing-library`, which makes it easy to
 * find form inputs by label, but has no builtin method for finding the
 * corresponding descriptions (which you might want when asserting about form
 * validation).
 */
const getDescribedBy = (el: HTMLElement) => {
  const describedBy = el.getAttribute("aria-describedby");
  if (describedBy === null) {
    throw new Error(
      "The specified element does not have an associated ariia-describedby.",
    );
  }
  // eslint-disable-next-line testing-library/no-node-access
  const descriptionEl = document.getElementById(describedBy);
  invariant(descriptionEl !== null, "descriptionEl should not be null");
  return descriptionEl;
};

export {
  assertInstanceOf,
  nodeId,
  permutations,
  flatProduct,
  pasteText,
  userWaits,
  allowActWarnings,
  getDescribedBy,
};
