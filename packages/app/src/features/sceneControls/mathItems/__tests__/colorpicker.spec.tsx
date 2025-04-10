import { MathItem, MathItemType as MIT } from "@math3d/mathitem-configs";
import { nodeId, renderTestApp, screen, within } from "@/test_util";
import { seedDb, makeItem } from "@math3d/mock-api";
import userEvent from "@testing-library/user-event";
import { getTimedEvents } from "@math3d/test-utils";

/**
 * Add an item to mathItems store and return some helpers for finding relevant
 * elements + data.
 */
const setup = async <R extends MIT>(
  type: R,
  itemProps: Partial<MathItem<R>["properties"]> = {},
) => {
  const user = userEvent.setup();
  const item = makeItem(type, itemProps);
  const id = nodeId(item);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().scene.mathScope();
  const findButton = () =>
    screen.findByRole("button", { name: "Show Graphic" });
  const getButton = () => screen.getByRole("button", { name: "Show Graphic" });
  const findTextInput = () => screen.findByTitle("Custom Color Input");
  const getAllSwatches = () => {
    const dialog = screen.getByRole("dialog");
    const swatches = within(dialog).getAllByRole("button");
    return swatches;
  };
  const getItem = () => store.getState().scene.items[item.id] as MathItem<R>;
  const getCalculatedProp = (prop: keyof MathItem<R>["properties"] & string) =>
    mathScope.results.get(id(prop));

  return {
    user,
    getItem,
    findButton,
    getButton,
    findTextInput,
    getAllSwatches,
    getCalculatedProp,
  };
};

test("short clicks on indicator toggle visibility", async () => {
  const { findButton, getItem, user } = await setup(MIT.Point);
  expect(getItem().properties.visible).toBe(true);
  await user.click(await findButton());
  expect(getItem().properties.visible).toBe(false);
  await user.click(await findButton());
  expect(getItem().properties.visible).toBe(true);
});

test("long press opens color picker dialog", async () => {
  const { findButton, getItem, getAllSwatches, user } = await setup(MIT.Point);
  const timedEvents = getTimedEvents(user);
  expect(getItem().properties.visible).toBe(true);
  expect(screen.queryByRole("dialog")).toBe(null);
  await timedEvents.pointerPrimary({
    target: await findButton(),
    duration: 500,
  });
  expect(screen.getByRole("dialog")).toBeDefined();
  // Still visible; long-press does not trigger normal click handler
  expect(getItem().properties.visible).toBe(true);
  const swatches = await getAllSwatches();
  expect(swatches).toHaveLength(10);
});

test("clicking a swatch sets item to that color", async () => {
  const { findButton, getItem, getAllSwatches, user } = await setup(MIT.Point);
  const timedEvents = getTimedEvents(user);

  expect(getItem().properties.color).toBe("#3090ff");
  await timedEvents.pointerPrimary({
    target: await findButton(),
    duration: 500,
  });
  const swatches = await getAllSwatches();
  await user.click(swatches[8]);
  expect(getItem().properties.color).toBe("#e74c3c");
});

test("Setting colorExpr for surfaces", async () => {
  const { getButton, getItem, user } = await setup(MIT.ExplicitSurface, {
    colorExpr: {
      type: "function-assignment",
      name: "_f",
      params: ["X", "Y", "Z", "a", "b"],
      rhs: "mod(a, 2)",
    },
    expr: {
      type: "function-assignment",
      name: "_f",
      params: ["a", "b"],
      rhs: "a^2 + b^2",
    },
    domain: {
      type: "array",
      items: [
        {
          type: "function-assignment",
          name: "_f",
          params: ["b"],
          rhs: "[-2, 2]",
        },
        {
          type: "function-assignment",
          name: "_f",
          params: ["a"],
          rhs: "[-2, 2]",
        },
      ],
    },
  });
  const timedEvents = getTimedEvents(user);
  await timedEvents.pointerPrimary({
    target: await getButton(),
    duration: 500,
  });

  const dialog = await screen.findByRole("dialog");

  await user.click(within(dialog).getByRole("tab", { name: "Color Map" }));

  within(dialog).getByText("f(X, Y, Z, a, b) =");

  const exprInput = within(dialog).getByRole("math", {
    name: "Color Expression",
  });

  // Shows correct text
  expect(exprInput).toHaveValue("mod(a, 2)");
  await user.click(exprInput);
  await user.paste(" + 0.1");
  // updates UI
  expect(exprInput).toHaveValue("mod(a, 2) + 0.1");
  // updates store
  expect(getItem().properties.colorExpr.rhs).toBe("mod(a, 2) + 0.1");
});
