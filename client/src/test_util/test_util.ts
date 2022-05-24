import * as R from "ramda";
import user from "@testing-library/user-event";
import { mathScopeId } from "features/sceneControls/mathItems/mathScope";
import { testId } from "features/sceneControls/mathItems/util";
import { MathItem } from "configs";

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

/**
 * Thin wrapper around `userEvent.type`. Doubles all instances of `[` since this
 * is a special character in `userEvent.type`.
 */
const typeText = (element: Element, text: string): Promise<void> => {
  const escaped = text.replaceAll("[", "[[");
  return user.type(element, escaped);
};

/**
 * Type assertion that asserts value is not null or undefined.
 *
 * Unlike jest assertions, this will refine the type.
 * See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
 */
const assertInstanceOf: <C extends { new (...args: any): any }>(
  value: unknown,
  Class: C
) => asserts value is InstanceType<C> = (value, Class) => {
  if (value instanceof Class) return;
  throw new Error(`Expected value to be instanceof ${Class}`);
};

export { permutations, nodeId, typeText, assertInstanceOf, testId };
