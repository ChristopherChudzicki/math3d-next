import { waitFor } from "@testing-library/react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import {
  assertInstanceOf,
  nodeId,
  renderTestApp,
  screen,
  user,
  within,
} from "@/test_util";
import { seedDb, makeItem } from "@math3d/mock-api";

/**
 * Sets up test scenario for MathBoolean:
 *  1. Render App with single Point
 *  2. Open Settings form
 *  3. Return form as HTML element `settings`
 */
const setup = async (initialValue: string) => {
  const point = makeItem(MIT.Point, { labelVisible: initialValue });
  const id = nodeId(point);
  const scene = seedDb.withSceneFromItems([point]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().scene.mathScope();
  await user.click(await screen.findByLabelText("More Settings"), {
    pointerEventsCheck: 0,
  });
  const settingsTitle = await screen.findByText("Settings", { exact: false });
  // eslint-disable-next-line testing-library/no-node-access
  const settings = settingsTitle.closest("section");
  assertInstanceOf(settings, HTMLElement);
  const booleanControl = within(settings).getByLabelText("Label Visible");

  const getValue = () => mathScope.results.get(id("labelVisible"));

  /**
   * Find and return the Switch button
   */
  const findToggle = async (): Promise<HTMLInputElement> => {
    const label = "Toggle property: Label Visible";
    const toggle = await within(settings).findByLabelText(label);
    assertInstanceOf(toggle, HTMLInputElement);
    return toggle;
  };
  const getReset = (): HTMLButtonElement => {
    const label = "Reset";
    const toggle = within(booleanControl).getByText(label);
    assertInstanceOf(toggle, HTMLButtonElement);
    return toggle;
  };
  const queryReset = (): HTMLElement | null => {
    const label = "Reset";
    return within(booleanControl).queryByText(label);
  };

  const findUseExpr = async (): Promise<HTMLButtonElement> => {
    const text = "Use Expression";
    const toggle = await within(booleanControl).findByText(text);
    assertInstanceOf(toggle, HTMLButtonElement);
    return toggle;
  };
  const queryUseExpr = (): HTMLElement | null => {
    const text = "Use Expression";
    return within(booleanControl).queryByText(text);
  };

  const findExpr = async (): Promise<HTMLTextAreaElement> => {
    const title = "Math Expression for: Label Visible";
    const expr = await within(settings).findByLabelText(title);
    assertInstanceOf(expr, HTMLTextAreaElement);
    return expr;
  };

  return {
    settings,
    mathScope,
    getValue,
    findToggle,
    getReset,
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
  'Shows "Use Expression" button iff switch is enabled (switch value computed)',
  async ({ initialValue, showUseExpression }) => {
    const { settings } = await setup(initialValue);
    const text = "Use Expression";
    const visible = within(settings).getByLabelText("Label Visible");
    const useExpression = within(visible).queryByText(text);
    expect(useExpression instanceof HTMLButtonElement).toBe(showUseExpression);
  },
);

describe("When the switch is initially enabled", () => {
  test.each(["false", "true"])(
    'enabled if value is "false" or "true"',
    async (initialValue) => {
      const { findToggle } = await setup(initialValue);
      expect(await findToggle()).toBeEnabled();
    },
  );

  test('disabled if value is not "false" or "true"', async () => {
    const { findToggle } = await setup("!false");
    expect(await findToggle()).toBeDisabled();
  });
});

test('Clicking "Use Expression" shows MathField and Reset', async () => {
  const { findExpr, getReset, findUseExpr } = await setup("false");

  expect(screen.queryByText("Reset")).toBe(null);
  await user.click(await findUseExpr(), { pointerEventsCheck: 0 });
  expect(getReset()).toHaveTextContent("Reset");

  getReset();
  await findExpr();
  await expect(findUseExpr).rejects.toBeTruthy();
});

test('Shows "Reset" button when switch is computed', async () => {
  const { queryReset, queryUseExpr, findExpr, getReset, findUseExpr } =
    await setup("!false");
  const expr = await findExpr();
  const reset = getReset();

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
  const { getReset, findToggle } = await setup("true || false");

  await user.click(await getReset(), { pointerEventsCheck: 0 });
  expect(await findToggle()).toBeEnabled();
});
