import { MathItemType as MIT } from "configs";
import { Point, PointProperties } from "configs/items/point";
import { act } from "react-dom/test-utils";
import {
  makeItem,
  nodeId,
  renderTestApp,
  screen,
  seedDb,
  user,
} from "test_util";

/**
 * Press and hold pointer on element for `ms` seconds.
 */
const longClick = async (element: HTMLElement, ms: number) => {
  jest.useFakeTimers();
  user.pointer({ keys: "[MouseLeft>]", target: element }); // press the left mouse button
  jest.advanceTimersByTime(ms);
  user.pointer({ keys: "[/MouseLeft]", target: element }); // release the left mouse button
  jest.useRealTimers();
};

/**
 * Add a single point to the mathItems store and return some helpers for finding
 * relevant elements + data.
 */
const setup = async () => {
  const point = makeItem(MIT.Point);
  const id = nodeId(point);
  const scene = seedDb.withSceneFromItems([point]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const mathScope = store.getState().mathItems.mathScope();
  const findButton = () => screen.findByTitle("Color and Visibility");
  const findDialog = () => screen.findByRole("dialog");
  const findTextInput = () => screen.findByTitle("Custom Color Input");
  const findAllSwatches = () => screen.findAllByTitle("Select Color");
  const getPoint = () => store.getState().mathItems.items[point.id] as Point;
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
  const { findButton, getCalculatedProp } = await setup();
  expect(getCalculatedProp("visible")).toBe(true);
  await user.click(await findButton());
  expect(getCalculatedProp("visible")).toBe(false);
  await user.click(await findButton());
  expect(getCalculatedProp("visible")).toBe(true);
});

test("long press opens color picker dialog", async () => {
  const { findButton, findDialog, getCalculatedProp, findAllSwatches } =
    await setup();
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
  const { findButton, getPoint, findAllSwatches } = await setup();
  expect(getPoint().properties.color).toBe("#3090ff");
  longClick(await findButton(), 1000);
  const swatches = await findAllSwatches();
  await user.click(swatches[8]);
  expect(getPoint().properties.color).toBe("#e74c3c");
});
