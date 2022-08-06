import {
  prettyDOM,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { MathItemType as MIT } from "configs";
import {
  assertInstanceOf,
  makeItem,
  nodeId,
  renderTestApp,
  screen,
  seedDb,
  user,
  within,
} from "test_util";

/**
 * Sets up test scenario for MathBoolean:
 *  1. Render App with single Point
 *  2. Open Settings form
 *  3. Return form as HTML element `settings`
 */
const setup = async (initialValue: string) => {
  const point = makeItem(MIT.Point, { visible: initialValue });
  const id = nodeId(point);
  const scene = seedDb.withSceneFromItems([point]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const mathScope = store.getState().mathItems.mathScope();
  await user.click(await screen.findByTitle("Show Settings"));
  const settings = await screen.findByTitle("Settings");

  const getValue = () => mathScope.results.get(id("visible"));
  const getEvalError = () => mathScope.evalErrors.get(id("visible"));
  const getParseError = () => mathScope.parseErrors.get(id("visible"));

  /**
   * Find and return the Switch button
   */
  const findToggle = async (): Promise<HTMLButtonElement> => {
    const title = "Toggle property: Visible";
    const toggle = await within(settings).findByTitle(title);
    assertInstanceOf(toggle, HTMLButtonElement);
    return toggle;
  };
  const findReset = async (): Promise<HTMLButtonElement> => {
    const title = "Reset: Visible";
    const toggle = await within(settings).findByTitle(title);
    assertInstanceOf(toggle, HTMLButtonElement);
    return toggle;
  };
  const queryReset = (): HTMLElement | null => {
    const title = "Reset: Visible";
    return within(settings).queryByTitle(title);
  };

  const findUseExpr = async (): Promise<HTMLButtonElement> => {
    const title = "Use Expression for: Visible";
    const toggle = await within(settings).findByTitle(title);
    assertInstanceOf(toggle, HTMLButtonElement);
    return toggle;
  };
  const queryUseExpr = (): HTMLElement | null => {
    const title = "Use Expression for: Visible";
    return within(settings).queryByTitle(title);
  };

  const findExpr = async (): Promise<HTMLTextAreaElement> => {
    const title = "Math Expression for: Visible";
    const expr = await within(settings).findByTitle(title);
    assertInstanceOf(expr, HTMLTextAreaElement);
    return expr;
  };

  return {
    settings,
    mathScope,
    getValue,
    getEvalError,
    getParseError,
    findToggle,
    findReset,
    findUseExpr,
    queryUseExpr,
    findExpr,
    queryReset,
  };
};

test("clicking switch toggles the value when switch is enabled", async () => {
  const { getValue, findToggle } = await setup("false");
  expect(getValue()).toBe(false);

  const toggle = await findToggle();
  expect(toggle.disabled).toBe(false);
  await user.click(toggle, { pointerEventsCheck: 0 });
  expect(getValue()).toBe(true);
});

test.each([
  { showUseExpression: true, initialValue: "false" },
  { showUseExpression: true, initialValue: "true" },
  { showUseExpression: false, initialValue: "!true" },
])(
  'Shows "Use Expression" button iff switch is enabled ("switch driven")',
  async ({ initialValue, showUseExpression }) => {
    const { settings } = await setup(initialValue);
    const title = "Use Expression for: Visible";
    const useExpression = within(settings).queryByTitle(title);
    expect(useExpression instanceof HTMLButtonElement).toBe(showUseExpression);
  }
);

describe("When the switch is initially enabled", () => {
  test.each(["false", "true"])(
    'enabled if value is "false" or "true"',
    async (initialValue) => {
      const { findToggle } = await setup(initialValue);
      expect(await findToggle()).toBeEnabled();
    }
  );

  test('disabled if value is not "false" or "true"', async () => {
    const { findToggle } = await setup("!false");
    expect(await findToggle()).toBeDisabled();
  });
});

test('Clicking "Use Expression" shows MathField and Reset', async () => {
  const { findExpr, findReset, findUseExpr } = await setup("false");

  await expect(findReset).rejects.toBeTruthy();
  await user.click(await findUseExpr(), { pointerEventsCheck: 0 });
  expect(await findReset()).toHaveTextContent("Reset");

  await findReset();
  await findExpr();
  await expect(findUseExpr).rejects.toBeTruthy();
});

test('Shows "Reset" button when switch is computed', async () => {
  const { queryReset, queryUseExpr, findExpr, findReset, findUseExpr } =
    await setup("!false");
  const expr = await findExpr();
  const reset = await findReset();

  expect(queryUseExpr()).toBe(null);
  await user.click(reset, { pointerEventsCheck: 0 });
  expect(await findUseExpr()).toHaveTextContent("Use Expression");
  await findUseExpr();
  await waitFor(() => {
    expect(expr).not.toBeVisible();
  });
  expect(queryReset()).toBe(null);
});

test("Clicking reset resets widget", async () => {
  const { findReset, findToggle } = await setup("true || false");

  await user.click(await findReset(), { pointerEventsCheck: 0 });

  expect(await findToggle()).toBeEnabled();
});
