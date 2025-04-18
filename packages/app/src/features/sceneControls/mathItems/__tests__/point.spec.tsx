import { MathItem, MathItemType as MIT } from "@math3d/mathitem-configs";
import {
  nodeId,
  pasteText,
  renderTestApp,
  screen,
  user,
  within,
} from "@/test_util";
import { seedDb, makeItem } from "@math3d/mock-api";
import { assertNotNil } from "@/util/predicates";
import { getItemByDescription } from "./__utils__";

test.each([
  {
    coordsString: "[1, 2, 3]",
    coords: [[1, 2, 3]],
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
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const item = makeItem(MIT.Point, { coords: coordsString });
    const id = nodeId(item);
    const scene = seedDb.withSceneFromItems([item]);
    const { store } = await renderTestApp(`/${scene.key}`);

    const mathScope = store.getState().scene.mathScope();
    expect(mathScope.errors.size).toBe(numEvalErrors + numParseErrors);
    expect(mathScope.results.get(id("coords"))).toStrictEqual(coords);
  },
);

test.each([
  {
    coordsString: "[1, 2, 3]",
    coords: [[1, 2, 3]],
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
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const item = makeItem(MIT.Point);
    const id = nodeId(item);
    const scene = seedDb.withSceneFromItems([item]);
    const { store } = await renderTestApp(`/${scene.key}`);

    const mathScope = store.getState().scene.mathScope();
    const coordsInput = await screen.findByLabelText("Coordinates");

    pasteText(coordsInput, coordsString);
    expect(mathScope.errors.size).toBe(numEvalErrors + numParseErrors);
    expect(mathScope.results.get(id("coords"))).toStrictEqual(coords);
  },
);

test("Adding items adds to mathScope", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().scene.mathScope();
  await user.click(await screen.findByText("Add Object"));
  const menu = await screen.findByRole("menu");
  const addPoint = await within(menu).findByText("Point");
  await user.click(addPoint, { pointerEventsCheck: 0 });

  const items = Object.values(store.getState().scene.items);
  expect(items).toHaveLength(2); // point + folder
  const point = Object.values(items).find(
    (item) => item.type === MIT.Point,
  ) as MathItem<MIT.Point>;
  assertNotNil(point);
  const id = nodeId(point);
  getItemByDescription(point.properties.description);
  expect(mathScope.results.get(id("coords"))).toStrictEqual([[0, 0, 0]]);
  expect(mathScope.errors.size).toBe(0);
});

test("Deleting items removes them from mathScope", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const point = makeItem(MIT.Point, {
    label: "Point 123",
    coords: "[1, 2, 3]",
    size: "1 + ",
    opacity: "2^[1,2,3]",
  });
  const scene = seedDb.withSceneFromItems([point]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().scene.mathScope();
  expect(mathScope.results.size).toBeGreaterThan(1); // point + folder visibility
  expect(mathScope.errors.size).toBeGreaterThan(0);

  const item = getItemByDescription(point.properties.description);
  const remove = within(item).getByLabelText("Remove Item");
  await user.click(remove);
  expect(mathScope.results.size).toBe(1); // folder visibility
  expect(mathScope.errors.size).toBe(0);
  expect(item).not.toBeInTheDocument();
});
