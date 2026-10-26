import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { faker } from "@faker-js/faker";
import {
  act,
  assertInstanceOf,
  renderTestApp,
  user,
  userWaits,
  waitFor,
  within,
  screen,
} from "@/test_util";
import { seedDb, makeItem } from "@math3d/mock-api";
import type { ResolvePromise } from "@math3d/utils";
import { ParseableObjs } from "@math3d/parser";
import { findItemByDescription, findBtn } from "@/test_util/mathItems";
import { mathScopeId } from "@/store/scene/evaluation/mathScope";

const valueObj = (v: string): ParseableObjs["assignment"] => {
  const [lhs, rhs] = v.split("=");
  return { lhs, rhs, type: "assignment" as const };
};

const btnLabels = {
  pause: "Pause",
  play: "Play",
  faster: "Increase speed",
  slower: "Decrease speed",
  increment: "Step forward",
  decrement: "Step backward",
};

const range = (min: string, max: string) => ({
  type: "array" as const,
  items: [min, max],
});

type Overrides = Partial<MathItem<MIT.VariableSlider>["properties"]>;

const setupTest = async (overrides: Overrides = {}) => {
  const min = faker.number.int({ min: -10, max: -6 });
  const max = faker.number.int({ min: 2, max: 10 });
  const fps = faker.number.int({ min: 20, max: 40 });
  const value = faker.number.float({ min, max, multipleOf: 0.1 });
  const duration = faker.number.float({
    min: 0.5,
    max: 1.5,
    multipleOf: 0.1,
  });
  const speed = faker.helpers.arrayElement(["1/4", "1/2", "1", "2", "4"]);
  const props: Overrides = {
    range: { items: [min, max].map(String), type: "array" },
    fps: String(fps),
    value: valueObj(`X=${value}`),
    duration: String(duration),
    speedMultiplier: speed,
    ...overrides,
  };

  const item = makeItem(MIT.VariableSlider, props);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = renderTestApp(`/${scene.key}`);

  const itemEl = await findItemByDescription(item.properties.description);
  const btnToggle = await findBtn(itemEl, /(Pause)|(Play)/);
  const btnFaster = await findBtn(itemEl, btnLabels.faster);
  const btnSlower = await findBtn(itemEl, btnLabels.slower);
  const btnIncrement = await findBtn(itemEl, btnLabels.increment);
  const btnDecrement = await findBtn(itemEl, btnLabels.decrement);
  const inputLhs = await within(itemEl).findByLabelText(
    "Value (left-hand side)",
  );
  const inputRhs = await within(itemEl).findByLabelText(
    "Value (right-hand side)",
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
  const mathScope = store.mathScope.get();
  mathScope.addEventListener("change", (e) => {
    if (e.detail.changes.results.updated.has(mathScopeId(item.id, "value"))) {
      const v = mathScope.results.get(valueId);
      if (typeof v !== "number") {
        throw new Error(`Value should be a number; received ${value}`);
      }
      valueUpdates.push(v);
    }
  });

  const getValueResult = () => mathScope.results.get(valueId);

  return {
    mathScope,
    store,
    el,
    item,
    valueUpdates,
    getValueResult,
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
  precision = 6,
) => {
  const min = Math.min(arr1.length, arr2.length);
  const max = Math.max(arr1.length, arr2.length);
  if (Math.abs(max - min) > lengthTolerance) {
    throw new Error(
      `arr1 and arr2 should have lengths within ${lengthTolerance} of each other`,
    );
  }
  const [rounded1, rounded2] = [arr1, arr2].map((arr) =>
    arr.slice(0, min).map((x) => x.toPrecision(precision)),
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
      duration: 0.48,
      fps: 12.5,
      min: -10,
      max: 11,
      periods: 2,
      // 6 ticks per period, one every 80ms (5 fake 16ms animation frames)
      // increment is (11 - -10)/6 = 3.5,  starting from 6
      expectedValues: repeat([9.5, -8.0, -4.5, -1.0, 2.5, 6.0], 2),
      props: {
        speedMultiplier: "1",
        // simple check that these are parsed as math
        duration: "0.48 + 0",
        fps: "12.5 + 0",
        range: range("-10 + 0", "11 + 0"),
        value: valueObj("X=6 + 0"),
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
    },
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
    },
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
    },
  );

  test.each([
    { speedMultiplier: "1/2", expectedValues: [0.8, 1.6, 2.4, 3.2] },
    { speedMultiplier: "2", expectedValues: [3.2, 6.4, 9.6, 2.8] },
  ])(
    "Speeding up/down affects duration and increment size, not framerate",
    async ({ speedMultiplier, expectedValues }) => {
      const timeout = 0.32;
      const props: Overrides = {
        speedMultiplier,
        duration: "0.5",
        fps: "12.5",
        range: range("0", "10"),
        value: valueObj("X=0"),
      };
      const { el, valueUpdates } = await setupTest(props);
      await user.click(el.btnToggle);
      await userWaits(timeout * 1000, { useFake: true });
      await user.click(el.btnToggle);

      expectSliderArraysEqual(valueUpdates, expectedValues);
    },
  );

  test("Steps by elapsed time when ticks land unevenly on frames", async () => {
    // A 40ms period over fake 16ms frames: ticks 48ms then 32ms apart, so
    // steps alternate between 1.2x and 0.8x the 0.4 increment.
    const { el, valueUpdates } = await setupTest({
      speedMultiplier: "1",
      duration: "1",
      fps: "25",
      range: range("0", "10"),
      value: valueObj("X=0"),
    });
    await user.click(el.btnToggle);
    await userWaits(200, { useFake: true });
    await user.click(el.btnToggle);

    // Real time passing during the clicks can add a tick, so compare a
    // prefix rather than the count.
    expectSliderArraysEqual(
      valueUpdates.slice(0, 4),
      [0.48, 0.8, 1.28, 1.6],
      0,
    );
  });

  test("Keeps animating while the Setup tab is showing", async () => {
    // A tick every 80ms; increment (11 - -10)/6 = 3.5
    const { el, valueUpdates } = await setupTest({
      speedMultiplier: "1",
      duration: "0.48",
      fps: "12.5",
      range: range("-10", "11"),
      value: valueObj("X=6"),
    });
    await user.click(el.btnToggle);
    await user.click(screen.getByRole("tab", { name: "Setup" }));
    expect(el.item).not.toBeInTheDocument();

    await userWaits(480, { useFake: true });

    expectSliderArraysEqual(
      valueUpdates.slice(0, 5),
      [9.5, -8.0, -4.5, -1.0, 2.5],
      0,
    );
  });

  test("Ticks once per period while its item is dragged", async () => {
    // A tick every 80ms
    const { el, item, store, valueUpdates } = await setupTest({
      speedMultiplier: "1",
      duration: "0.48",
      fps: "12.5",
    });
    const sortable = el.item.closest<HTMLElement>(
      "[aria-roledescription=sortable]",
    );
    assertInstanceOf(sortable, HTMLElement);
    await user.click(el.btnToggle);
    act(() => sortable.focus());
    await user.keyboard("[Space]");
    await userWaits(20, { useFake: true });
    // The drag overlay renders a second copy of the item's form.
    expect(
      screen.getAllByLabelText(`Settings for ${item.properties.description}`),
    ).toHaveLength(2);

    let dispatches = 0;
    const unsubscribe = store.subscribe(() => {
      dispatches += 1;
    });
    const updatesBefore = valueUpdates.length;
    await userWaits(480, { useFake: true });
    unsubscribe();

    const updates = valueUpdates.length - updatesBefore;
    // 6 periods; real time passing during the wait can add one.
    expect(updates).toBeGreaterThanOrEqual(6);
    expect(updates).toBeLessThanOrEqual(7);
    expect(dispatches).toBe(updates);
  });

  test("Continues from a value the user steps to mid-animation", async () => {
    // A tick every 80ms; ticks and steps both move by 3.5.
    const { el, valueUpdates } = await setupTest({
      speedMultiplier: "1",
      duration: "0.48",
      fps: "12.5",
      range: range("-10", "11"),
    });
    await user.click(el.btnToggle);
    await userWaits(100, { useFake: true });
    expect(valueUpdates.length).toBeGreaterThan(0);
    const ticked = valueUpdates[valueUpdates.length - 1];

    // A synchronous click, so no ticks land between the step and the wait.
    act(() => el.btnDecrement.click());
    await userWaits(80, { useFake: true });

    // One step back, then one tick forward from the stepped value.
    expectSliderArraysEqual(valueUpdates.slice(-2), [ticked - 3.5, ticked], 0);
  });

  test("Pauses playback, keeping the text, while the value is invalid", async () => {
    const { el, valueUpdates } = await setupTest();
    await user.click(el.inputRhs);
    await user.clear(el.inputRhs);
    await user.paste("1+");
    await user.click(el.btnToggle);
    const updatesBefore = valueUpdates.length;

    await userWaits(300, { useFake: true });

    expect(el.inputRhs.value).toBe("1+");
    expect(valueUpdates.length).toBe(updatesBefore);
    expect(el.btnToggle).toHaveAccessibleName(btnLabels.pause);
  });

  test.each(["1+1", ""])(
    "Displays the non-numeric value %j as written",
    async (rhs) => {
      const { el } = await setupTest({ value: valueObj(`X=${rhs}`) });
      expect(el.inputRhs.value).toBe(rhs);
    },
  );

  test("Animating returns the value display to 2 digits", async () => {
    const { el } = await setupTest({
      range: range("0", "1"),
      duration: "0.5",
      fps: "6",
      speedMultiplier: "1",
    });
    await user.click(el.inputRhs);
    await user.clear(el.inputRhs);
    await user.paste("0.111");
    expect(el.inputRhs.value).toBe("0.111");

    await user.click(el.btnToggle);
    await userWaits(200, { useFake: true });

    expect(el.inputRhs.value).toMatch(/^\+0\.\d\d$/);
  });

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
      value: valueObj("X=1"),
      range: { items: ["-2", "+3"], type: "array" },
    });
    const mathsScope = store.mathScope.get();
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
        value: valueObj("X=1"),
        range: { items: ["-10", "+10"], type: "array" },
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
    },
  );

  test("value display shows 2 digits except when set explicitly by user", async () => {
    const { el } = await setupTest({
      value: valueObj("X=0"),
      range: { items: ["0", "1"], type: "array" },
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

  test("validates that min < max", async () => {
    const { el } = await setupTest({
      value: valueObj("X=1"),
      range: { items: ["5", "1"], type: "array" },
    });

    const { inputMin, inputMax } = el;
    act(() => inputMin.focus());
    expect(inputMin).toHaveClass("has-error");
    const tooltipMin = await screen.findByRole("tooltip");
    expect(tooltipMin).toHaveTextContent("Minimum must be less than maximum.");

    act(() => inputMax.focus());
    expect(inputMax).toHaveClass("has-error");
    const tooltipMax = await screen.findByRole("tooltip");
    expect(tooltipMax).toHaveTextContent("Minimum must be less than maximum.");

    await user.type(inputMax, "5");

    expect(inputMin).not.toHaveClass("has-error");
    expect(inputMax).not.toHaveClass("has-error");

    expect(el.slider.min).toBe("5");
    expect(el.slider.max).toBe("15");
  });
});
