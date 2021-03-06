import { MathItem, MathItemType as MIT } from "configs";
import {
  makeItem,
  nodeId,
  patchConsoleError,
  renderTestApp,
  screen,
  seedDb,
  typeText,
  user,
  within,
} from "test_util";
import { assertNotNil } from "util/predicates";

/**
 * Antd is causing react to complain that some things aren't wrapped in act(...).
 * But everything seems to be working fine, so let's just ignore that error.
 */
const restore = patchConsoleError([{ ignoreData: "ForwardRef(TabNavList)" }]);
afterAll(restore);

test.each([
  {
    coordsString: "[1, 2, 3]",
    coords: [1, 2, 3],
    numParseErrors: 0,
    numEvalErrors: 0,
  },
  {
    coordsString: "[1, 2, 3",
    coords: undefined,
    numParseErrors: 1,
    numEvalErrors: 0,
  },
  {
    coordsString: "2^[1, 2, 3]",
    coords: undefined,
    numParseErrors: 0,
    numEvalErrors: 1,
  },
])(
  "initial coords evaluation/errors are correct; text=$coordsString",
  async ({ coordsString, coords, numParseErrors, numEvalErrors }) => {
    const item = makeItem(MIT.Point, { coords: coordsString });
    const id = nodeId(item);
    const scene = seedDb.withSceneFromItems([item]);
    const { store } = await renderTestApp(`/${scene.id}`);

    const mathScope = store.getState().mathItems.mathScope();
    expect(mathScope.evalErrors.size).toBe(numEvalErrors);
    expect(mathScope.parseErrors.size).toBe(numParseErrors);
    expect(mathScope.results.get(id("coords"))).toStrictEqual(coords);
  }
);

test.each([
  {
    coordsString: "[1, 2, 3]",
    coords: [1, 2, 3],
    numParseErrors: 0,
    numEvalErrors: 0,
  },
  {
    coordsString: "[1, 2, 3",
    coords: undefined,
    numParseErrors: 1,
    numEvalErrors: 0,
  },
  {
    coordsString: "2^[1, 2, 3]",
    coords: undefined,
    numParseErrors: 0,
    numEvalErrors: 1,
  },
])(
  "coords evaluation/errors update on text change; text='$coordsString'",
  async ({ coords, coordsString, numEvalErrors, numParseErrors }) => {
    const item = makeItem(MIT.Point);
    const id = nodeId(item);
    const scene = seedDb.withSceneFromItems([item]);
    const { store } = await renderTestApp(`/${scene.id}`);

    const mathScope = store.getState().mathItems.mathScope();
    const coordsInput = await screen.findByTitle("Coordinates");
    user.clear(coordsInput);
    await typeText(coordsInput, coordsString);
    expect(mathScope.evalErrors.size).toBe(numEvalErrors);
    expect(mathScope.parseErrors.size).toBe(numParseErrors);
    expect(mathScope.results.get(id("coords"))).toStrictEqual(coords);
  }
);

test("Adding items adds to mathScope", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const mathScope = store.getState().mathItems.mathScope();
  await user.click(await screen.findByText("Add New Object"));
  const menu = await screen.findByRole("menu");
  const addPoint = await within(menu).findByText("Point");
  // antd has issues with point-events checks, see, e.g.,
  await user.click(addPoint, { pointerEventsCheck: 0 });

  const items = Object.values(store.getState().mathItems.items);
  expect(items).toHaveLength(2); // point + folder
  const point = Object.values(items).find(
    (item) => item.type === MIT.Point
  ) as MathItem<MIT.Point>;
  assertNotNil(point);
  const id = nodeId(point);
  screen.getByTestId(`mathItem-${point.id}`);
  expect(mathScope.results.get(id("coords"))).toStrictEqual([0, 0, 0]);
  expect(mathScope.evalErrors.size).toBe(0);
  expect(mathScope.parseErrors.size).toBe(0);
});

test("Deleting items removes them from mathScope", async () => {
  const point = makeItem(MIT.Point, {
    label: "Point 123",
    coords: "[1, 2, 3]",
    size: "1 + ",
    opacity: "2^[1,2,3]",
  });
  const scene = seedDb.withSceneFromItems([point]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const mathScope = store.getState().mathItems.mathScope();
  expect(mathScope.results.size).toBeGreaterThan(1); // point + folder visibility
  expect(mathScope.parseErrors.size).toBeGreaterThan(0);
  expect(mathScope.evalErrors.size).toBeGreaterThan(0);

  const item = screen.getByTestId(`mathItem-${point.id}`);
  const remove = within(item).getByLabelText("Remove Item");
  await user.click(remove);
  expect(mathScope.results.size).toBe(1); // folder visibility
  expect(mathScope.parseErrors.size).toBe(0);
  expect(mathScope.evalErrors.size).toBe(0);
  expect(item).not.toBeInTheDocument();
});
