import user from "@testing-library/user-event";
import { MathItem } from "configs";
import { mathScopeId } from "features/sceneControls/mathItems/mathScope";
import { testId } from "features/sceneControls/mathItems/util";
import * as R from "ramda";
import { assertInstanceOf } from "util/predicates";

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

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const shortSleep = () => sleep(15);

export {
  assertInstanceOf,
  nodeId,
  permutations,
  testId,
  typeText,
  sleep,
  shortSleep,
};
