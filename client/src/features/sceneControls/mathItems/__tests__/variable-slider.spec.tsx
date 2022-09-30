import _ from "lodash";
import { MathItemType as MIT } from "@/configs";
import type { MathItem } from "@/configs";
import { makeItem, renderTestApp, seedDb, user, act } from "@/test_util";
import { faker } from "@faker-js/faker";
import { getItemByDescription, findBtn } from "./__utils__";
import { mathScopeId } from "../mathScope";

const btnLabels = {
  pause: "Pause",
  play: "Play",
  faster: "Increase speed",
  slower: "Decrease speed",
  increment: "Step forward",
  decrement: "Step backward",
};

const setupTest = async (
  properties: Partial<MathItem<MIT.VariableSlider>["properties"]> = {}
) => {
  const item = makeItem(MIT.VariableSlider, properties);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.id}`);
  const itemEl = getItemByDescription(item.properties.description);
  const btnToggle = await findBtn(itemEl, /(Pause)|(Play)/);
  const btnFaster = await findBtn(itemEl, btnLabels.faster);
  const btnSlower = await findBtn(itemEl, btnLabels.slower);
  const btnIncrement = await findBtn(itemEl, btnLabels.increment);
  const btnDecremet = await findBtn(itemEl, btnLabels.decrement);

  const el = {
    item: itemEl,
    btnToggle,
    btnFaster,
    btnSlower,
    btnIncrement,
    btnDecremet,
  };

  const valueUpdates: number[] = [];
  const valueId = mathScopeId(item.id, "value");
  const mathScope = store.getState().mathItems.mathScope();
  mathScope.addEventListener("change", (e) => {
    if (e.changes.results.updated.has(mathScopeId(item.id, "value"))) {
      const value = mathScope.results.get(valueId);
      if (typeof value !== "number") {
        throw new Error(`Value should be a number; received ${value}`);
      }
      valueUpdates.push(value);
    }
  });

  const getValueResult = () => mathScope.results.get(valueId);
  const getValueError = (type: "parse" | "eval") =>
    type === "parse"
      ? mathScope.parseErrors.get(valueId)
      : mathScope.evalErrors.get(valueId);

  return {
    store,
    el,
    item,
    valueUpdates,
    getValueResult,
    getValueError,
  };
};

const sleep = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * Repeat the elements of an array a specified number of times.
 * @example
 * ```ts
 * repeat(["a", "b"], 4)
 * // ["a", "b", "a", "b", "a", "b", "a", "b"]
 * ```
 */
const repeat = <T,>(arr: T[], n: number): T[] =>
  Array(n)
    .fill(null)
    .flatMap(() => arr);

describe("Variable Slider", () => {
  test.each([
    {
      duration: 0.6,
      fps: 10,
      min: -10,
      max: 11,
      periods: 2,
      expectedFrames: 12 /** 6 frames per period */,
      // increment is (11 - -10)/6 = 3.5,  starting from 6
      // one extra period
      expectedValues: repeat([9.5, -8.0, -4.5, -1.0, 2.5, 6.0], 3),
      props: {
        // simple check that these are parsed as math
        duration: "0.6 + 0",
        fps: "10 + 0",
        min: "-10 + 0",
        max: "11 + 0",
        value: "X=6 + 0",
      },
    },
    {
      duration: 0.4,
      fps: 20,
      min: 4,
      max: 10,
      periods: 3,
      expectedFrames: 24 /** 8 frames per period */,
      // increment is (10 - 4)/8 = 0.75,  starting from 5
      // one extra period
      expectedValues: repeat([5.75, 6.5, 7.25, 8, 8.75, 9.5, 4.25, 5], 4),
      props: {
        duration: "0.4 + 0",
        fps: "20 + 0",
        min: "4 + 0",
        max: "10 + 0",
        value: "X=5 + 0",
      },
    },
  ])(
    "It continuously updates mathscope with values while play button is active",
    async ({ duration, periods, props, expectedValues, expectedFrames }) => {
      const { el, valueUpdates } = await setupTest(props);
      expect(valueUpdates.length).toBe(0);

      await user.click(el.btnToggle);
      await act(() => sleep(periods * duration * 1000));
      await user.click(el.btnToggle);
      const actualLength = valueUpdates.length;
      // We expect expectedFrames, but let's allow +/- 1 of that.
      expect(actualLength).toBeLessThanOrEqual(expectedFrames + 1);
      expect(actualLength).toBeGreaterThanOrEqual(expectedFrames - 1);
      expect(valueUpdates).toEqual(expectedValues.slice(0, actualLength));

      // No new updates after paused.
      await act(() => sleep(duration * 1000));
      expect(valueUpdates.length).toBe(actualLength);
    }
  );

  /**
   * Tests:
   * 1. framerates and and base durations
   * 2. play/pause
   * 3. step up/down does 1x increment
   * 4. speed up/down affects increment duration, not framerate
   * 5. Renaming the variable
   * 6. Passes max/min values to slider
   * 7. step up with slider
   * Playwright:
   * 1. mathlive truncation
   */
});
