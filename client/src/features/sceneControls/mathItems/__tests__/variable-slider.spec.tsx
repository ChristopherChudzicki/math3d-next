import { MathItemType as MIT } from "@/configs";
import type { MathItem } from "@/configs";
import {
  act,
  assertInstanceOf,
  makeItem,
  renderTestApp,
  seedDb,
  user,
  userWaits,
  waitFor,
  within,
  screen,
} from "@/test_util";
import type { ResolvePromise } from "@/types/util";
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
  overrides: Partial<MathItem<MIT.VariableSlider>["properties"]> = {}
) => {
  const min = faker.datatype.number({ min: -10, max: -6 });
  const max = faker.datatype.number({ min: 2, max: 10 });
  const fps = faker.datatype.number({ min: 20, max: 40 });
  const value = faker.datatype.number({ min, max, precision: 0.1 });
  const duration = faker.datatype.number({
    min: 0.5,
    max: 1.5,
    precision: 0.1,
  });
  const speed = faker.helpers.arrayElement(["1/4", "1/2", "1", "2", "4"]);
  const props = {
    min: String(min),
    max: String(max),
    fps: String(fps),
    value: `X=${value}`,
    duration: String(duration),
    speedMultiplier: speed,
    ...overrides,
  };

  const item = makeItem(MIT.VariableSlider, props);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.id}`);
  const itemEl = getItemByDescription(item.properties.description);
  const btnToggle = await findBtn(itemEl, /(Pause)|(Play)/);
  const btnFaster = await findBtn(itemEl, btnLabels.faster);
  const btnSlower = await findBtn(itemEl, btnLabels.slower);
  const btnIncrement = await findBtn(itemEl, btnLabels.increment);
  const btnDecrement = await findBtn(itemEl, btnLabels.decrement);
  const inputLhs = await within(itemEl).findByLabelText(
    "Value (left-hand side)"
  );
  const inputRhs = await within(itemEl).findByLabelText(
    "Value (right-hand side)"
  );
  const inputMin = await within(itemEl).findByLabelText("Min");
  const inputMax = await within(itemEl).findByLabelText("Max");
  const slider = await within(itemEl).findByLabelText("Value");
  assertInstanceOf(inputMin, HTMLTextAreaElement);
  assertInstanceOf(inputMax, HTMLTextAreaElement);
  assertInstanceOf(inputLhs, HTMLTextAreaElement);
  assertInstanceOf(inputRhs, HTMLTextAreaElement);
  assertInstanceOf(slider, HTMLInputElement);

  const el = {
    item: itemEl,
    btnToggle,
    btnFaster,
    btnSlower,
    btnIncrement,
    btnDecrement,
    slider,
    inputRhs,
    inputLhs,
    inputMin,
    inputMax,
  };

  const valueUpdates: number[] = [];
  const valueId = mathScopeId(item.id, "value");
  const mathScope = store.getState().mathItems.mathScope();
  mathScope.addEventListener("change", (e) => {
    if (e.changes.results.updated.has(mathScopeId(item.id, "value"))) {
      const v = mathScope.results.get(valueId);
      if (typeof v !== "number") {
        throw new Error(`Value should be a number; received ${value}`);
      }
      valueUpdates.push(v);
    }
  });

  const getValueResult = () => mathScope.results.get(valueId);
  const getValueError = (type: "parse" | "eval") =>
    type === "parse"
      ? mathScope.parseErrors.get(valueId)
      : mathScope.evalErrors.get(valueId);

  return {
    mathScope,
    store,
    el,
    item,
    valueUpdates,
    getValueResult,
    getValueError,
    props,
    min,
    max,
    fps,
    value,
    duration,
    speed,
  };
};
type SetupResult = ResolvePromise<ReturnType<typeof setupTest>>;

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

const expectSliderArraysEqual = (
  arr1: number[],
  arr2: number[],
  lengthTolerance = 1,
  precision = 6
) => {
  const min = Math.min(arr1.length, arr2.length);
  const max = Math.max(arr1.length, arr2.length);
  if (Math.abs(max - min) > lengthTolerance) {
    throw new Error(
      `arr1 and arr2 should have lengths within ${lengthTolerance} of each other`
    );
  }
  const [rounded1, rounded2] = [arr1, arr2].map((arr) =>
    arr.slice(0, min).map((x) => x.toPrecision(precision))
  );
  expect(rounded1).toEqual(rounded2);
};

describe("Variable Slider", () => {
  beforeEach(() => {
    // See https://github.com/testing-library/dom-testing-library/issues/987#issuecomment-1266266801
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.each([
    {
      duration: 0.6,
      fps: 10,
      min: -10,
      max: 11,
      periods: 2,
      // 6 frames per period
      // increment is (11 - -10)/6 = 3.5,  starting from 6
      expectedValues: repeat([9.5, -8.0, -4.5, -1.0, 2.5, 6.0], 2),
      props: {
        speedMultiplier: "1",
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
      // 8 frames per period
      // increment is (10 - 4)/8 = 0.75,  starting from 5
      expectedValues: repeat([5.75, 6.5, 7.25, 8, 8.75, 9.5, 4.25, 5], 3),
      props: {
        speedMultiplier: "1",
        duration: "0.4 + 0",
        fps: "20 + 0",
        min: "4 + 0",
        max: "10 + 0",
        value: "X=5 + 0",
      },
    },
  ])(
    "It continuously updates mathscope with values only when play button is active",
    async ({ duration, periods, props, expectedValues }) => {
      const { el, valueUpdates } = await setupTest(props);
      expect(valueUpdates.length).toBe(0);

      await user.click(el.btnToggle);

      await userWaits(periods * duration * 1000, { useFake: true });

      await user.click(el.btnToggle);
      expectSliderArraysEqual(valueUpdates, expectedValues);

      // No new updates after paused.
      await userWaits(duration * 1000, { useFake: true });
      expectSliderArraysEqual(valueUpdates, expectedValues);
    }
  );

  test.each([
    { btn: "btnIncrement" as const, dirMultiplier: +1, adjective: "up" },
    { btn: "btnDecrement" as const, dirMultiplier: -1, adjective: "down" },
  ])(
    "Clicking step $adjective button increments slider $adjective",
    async ({ btn, dirMultiplier }) => {
      const { el, valueUpdates, fps, duration, max, min, value } =
        await setupTest();
      const frames = fps * duration;
      const increment = (max - min) / frames;
      expect(valueUpdates.length).toBe(0);
      await user.click(el[btn]);

      expect(increment).toBeGreaterThan(0);
      expect(typeof valueUpdates[0]).toBe("number");
      expect(valueUpdates[0]).toEqual(value + dirMultiplier * increment);
    }
  );

  /**
   * Skipping this for now. @testing-library/user-event seems not to trigger
   * change events on range inputs when arrow keys are pressed.
   * See https://github.com/testing-library/user-event/issues/1067
   */
  test.skip.each([
    { key: "ArrowLeft", dirMultiplier: +1, adjective: "up" },
    { key: "ArrowRight", dirMultiplier: -1, adjective: "down" },
  ])(
    "Pressing $key with slider focused increments slider $adjective",
    async ({ key, dirMultiplier }) => {
      const { el, valueUpdates, fps, duration, max, min, value } =
        await setupTest();
      const frames = fps * duration;
      const increment = (max - min) / frames;
      expect(valueUpdates.length).toBe(0);

      act(() => el.slider.focus());
      await userWaits(100, { useFake: true });
      await user.keyboard(`{${key}}`);
      expect(increment).toBeGreaterThan(0);
      expect(typeof valueUpdates[0]).toBe("number");
      expect(valueUpdates[0]).toEqual(value + dirMultiplier * increment);
    }
  );

  test.each([
    { speedMultiplier: "1/2", expectedValues: [2, 4, 6, 8] },
    { speedMultiplier: "1", expectedValues: [1, 2, 3, 4] },
    { speedMultiplier: "2", expectedValues: [0.5, 1, 1.5, 2] },
  ])(
    "Speeding up/down affects duration and increment size, not framerate",
    async ({ speedMultiplier, expectedValues }) => {
      const timeout = 1 / 5;
      const props = {
        speedMultiplier,
        duration: "0.5",
        fps: "20",
        min: "0",
        max: "10",
        value: "X=0",
      };
      const { el, valueUpdates } = await setupTest(props);
      await user.click(el.btnToggle);
      await userWaits(timeout * 1000, { useFake: true });
      await user.click(el.btnToggle);

      expectSliderArraysEqual(valueUpdates, expectedValues);
    }
  );

  test("Min, max, step passed to input[type=range]", async () => {
    const { el, min, max, fps, duration } = await setupTest();
    const frames = fps * duration;
    const step = (max - min) / frames;

    expect(el.slider.type).toBe("range");
    await waitFor(() => expect(el.slider.min).toBe(String(min)));
    expect(el.slider.max).toBe(String(max));
    expect(el.slider.step).toBe(String(step));
  });

  test("Renaming variable changes name in mathscope", async () => {
    const { el, store } = await setupTest({
      value: "X=1",
      min: "-2",
      max: "+3",
    });
    const mathsScope = store.getState().mathItems.mathScope();
    expect(mathsScope.evalScope).toEqual(new Map(Object.entries({ X: 1 })));

    act(() => el.inputLhs.focus());

    await user.clear(el.inputLhs);
    await user.paste("Y1");
    expect(mathsScope.evalScope).toEqual(new Map(Object.entries({ Y1: 1 })));
  });

  test.each([
    {
      getInput: (el: SetupResult["el"]) => el.inputMin,
      inputDecription: "min",
      goodValue: "1+1",
      badValue: "1+",
    },
    {
      getInput: (el: SetupResult["el"]) => el.inputMax,
      inputDecription: "max",
      goodValue: "1+1",
      badValue: "1+",
    },
    {
      getInput: (el: SetupResult["el"]) => el.inputLhs,
      inputDecription: "lhs",
      goodValue: "X1",
      badValue: "X+",
    },
    {
      getInput: (el: SetupResult["el"]) => el.inputRhs,
      inputDecription: "rhs",
      goodValue: "1+1",
      badValue: "1+",
    },
  ])(
    "$inputDecription show errors and pass previous value to slider",
    async ({ getInput, goodValue, badValue }) => {
      const { el } = await setupTest({
        value: "X=1",
        min: "-10",
        max: "+10",
      });
      const inputEl = getInput(el);
      act(() => inputEl.focus());
      await user.clear(inputEl);
      await user.paste(badValue);
      expect(inputEl).toHaveClass("has-error");
      const tooltip = await screen.findByRole("tooltip");
      expect(inputEl).toHaveClass("has-error");

      expect(el.slider.min).toBe("-10");
      expect(el.slider.value).toBe("1");
      expect(el.slider.max).toBe("10");

      await user.clear(inputEl);
      await user.paste(goodValue);
      expect(inputEl).not.toHaveClass("has-error");
      await waitFor(() => {
        expect(tooltip).not.toBeInTheDocument();
      });
    }
  );

  test("value display shows 2 digits except when set explicitly by user", async () => {
    const { el } = await setupTest({
      value: "X=0",
      min: "0",
      max: "1",
      duration: "0.5",
      fps: "6",
      speedMultiplier: "1",
    });

    await user.click(el.btnIncrement);
    await user.click(el.btnIncrement);

    /**
     * Slider and events have exact value; input displays approx value
     */
    expect(el.slider.value).toBeCloseTo(2 / 3, 6);
    expect(el.inputRhs.value).toBe("+0.67");

    /**
     * inputRhs can have extra digits if set by user
     */
    await user.click(el.inputRhs);
    await user.clear(el.inputRhs);
    await user.paste("0.111");
    expect(el.slider.value).toBe("0.111");
    expect(el.inputRhs.value).toBe("0.111");

    /**
     * After being set by user, inputRhs goes back to 2 digits when incremented
     * by buttons (or slider; not tested here.)
     */
    await user.click(el.btnIncrement);
    expect(el.slider.value).toBeCloseTo(0.4443333, 6);
    expect(el.inputRhs.value).toBe("+0.44");
  });
});
