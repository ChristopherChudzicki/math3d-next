import { MathItemType as MIT } from "configs";
import { Point, PointProperties } from "configs/items/point";
import { IntegrationTest, makeItem, nodeId, screen, user } from "test_util";

/**
 * Press and hold pointer on element for `ms` seconds.
 */
const longClick = async (element: HTMLElement, ms: number) => {
  jest.useFakeTimers();
  element.focus();
  user.pointer({ keys: "[MouseLeft>]", target: element }); // press the left mouse button
  jest.advanceTimersByTime(ms);
  user.pointer({ keys: "[/MouseLeft]", target: element }); // release the left mouse button
  jest.useRealTimers();
};

/**
 * Add a single point to the mathItems store and return some helpers for finding
 * relevant elements + data.
 */
const setup = () => {
  const point = makeItem(MIT.Point);
  const id = nodeId(point);
  const helper = new IntegrationTest();
  helper.patchMathItems([point]);
  const { mathScope, store } = helper.render();
  const findButton = () => screen.findByTitle("Color and Visibility");
  const findDialog = () => screen.findByRole("dialog");
  const findTextInput = () => screen.findByTitle("Custom Color Input");
  const findAllSwatches = () => screen.findAllByTitle("Select Color");
  const getPoint = () => store.getState().mathItems[point.id] as Point;
  const getCalculatedProp = (prop: keyof PointProperties) =>
    mathScope.results.get(id(prop));
  return {
    getPoint,
    findButton,
    findDialog,
    findTextInput,
    findAllSwatches,
    getCalculatedProp,
  };
};

test("short clicks on indicator toggle visibility", async () => {
  const { findButton, getCalculatedProp } = setup();
  expect(getCalculatedProp("visible")).toBe(true);
  await user.click(await findButton());
  expect(getCalculatedProp("visible")).toBe(false);
  await user.click(await findButton());
  expect(getCalculatedProp("visible")).toBe(true);
});

test("long press opens color picker dialog", async () => {
  const { findButton, findDialog, getCalculatedProp, findAllSwatches } =
    setup();
  expect(getCalculatedProp("visible")).toBe(true);
  await expect(findDialog).rejects.toBeDefined();
  longClick(await findButton(), 1000);
  expect(await findDialog()).toBeDefined();
  // Still visible; long-press does not fire normal click event
  expect(getCalculatedProp("visible")).toBe(true);
  const swatches = await findAllSwatches();
  expect(swatches).toHaveLength(11);
});

test("clicking a swatch sets item to that color", async () => {
  const { findButton, getPoint, findAllSwatches } = setup();
  expect(getPoint().properties.color).toBe("#3090ff");
  longClick(await findButton(), 1000);
  const swatches = await findAllSwatches();
  await user.click(swatches[8]);
  expect(getPoint().properties.color).toBe("#e74c3c");
});