import { act } from "@testing-library/react";
import { MathItemType as MIT } from "@/configs";
import {
  makeItem,
  screen,
  waitFor,
  shortSleep,
  seedDb,
  renderTestApp,
} from "@/test_util";

const getTooltip = () => screen.getByRole("tooltip");
const queryTooltip = () => screen.queryByRole("tooltip");

test.each([
  {
    getInput: () => screen.getByLabelText("Value (left-hand side)"),
    item: makeItem(MIT.Variable, { value: "a + = 1" }),
    errMatcher: /Invalid assignment left-hand side/,
  },
  {
    getInput: () => screen.getByLabelText("Value (right-hand side)"),
    item: makeItem(MIT.Variable, { value: "a = 1 + " }),
    errMatcher: /Unexpected end of expression/,
  },
  {
    getInput: () => screen.getByLabelText("Coordinates"),
    item: makeItem(MIT.Point, { coords: "[1,2,3] + " }),
    errMatcher: /Unexpected end of expression/,
  },
])(
  "Widgets display error message in tooltip only when focused",
  async ({ getInput, item, errMatcher }) => {
    const scene = seedDb.withSceneFromItems([item]);
    await renderTestApp(`/${scene.id}`);
    const theInput = getInput();

    // not initially shown
    expect(queryTooltip()).not.toBeInTheDocument();

    // shown when focused
    act(() => theInput.focus());
    const tooltip = await waitFor(getTooltip);
    expect(tooltip).toHaveTextContent(errMatcher);

    // not shown after blur
    act(() => theInput.blur());
    expect(tooltip).not.toBeInTheDocument();
  }
);

test("Widget does not show a tooltip when focused if no error", async () => {
  const item = makeItem(MIT.Point, { coords: "[1,2,3] + 1" });
  const scene = seedDb.withSceneFromItems([item]);
  await renderTestApp(`/${scene.id}`);

  const theInput = screen.getByLabelText("Coordinates");

  // not initially shown
  expect(queryTooltip()).not.toBeInTheDocument();

  // shown when focused
  act(() => theInput.focus());
  // if the tooltip was going to show, it would show asynchronously in reaction
  // to the focus event. So wait just a sec before checking.
  await shortSleep();
  expect(queryTooltip()).not.toBeInTheDocument();

  // not shown after blur
  act(() => theInput.blur());
  await shortSleep();
  expect(queryTooltip()).not.toBeInTheDocument();
});
