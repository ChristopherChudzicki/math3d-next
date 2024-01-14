import { MathItem, MathItemType as MIT } from "@math3d/mathitem-configs";
import { nodeId, renderTestApp, screen, user, act, within } from "@/test_util";
import { seedDb, makeItem } from "@math3d/mock-api";

/**
 * Press and hold pointer on element for `ms` seconds.
 */
const longClick = async (element: HTMLElement, ms: number) => {
  await user.pointer({ keys: "[MouseLeft>]", target: element }); // press the left mouse button
  await user.pointer({ keys: "[/MouseLeft]", target: element }); // release the left mouse button
  /**
   * Confused why the waiting happens after pointer-up, but putting it between does not work...
   */
  await act(
    () =>
      new Promise((res) => {
        setTimeout(res, ms);
      }),
  );
};

/**
 * Add an item to mathItems store and return some helpers for finding relevant
 * elements + data.
 */
const setup = async <R extends MIT>(
  type: R,
  itemProps: Partial<MathItem<R>["properties"]> = {},
) => {
  const item = makeItem(type, itemProps);
  const id = nodeId(item);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().mathItems.mathScope();
  const findButton = () => screen.findByTitle("Color and Visibility");
  const getButton = () =>
    screen.getByRole("button", { name: "Color and Visibility" });
  const findTextInput = () => screen.findByTitle("Custom Color Input");
  const getAllSwatches = () => {
    const dialog = screen.getByRole("dialog");
    const swatches = within(dialog).getAllByRole("button");
    return swatches;
  };
  const getItem = () =>
    store.getState().mathItems.items[item.id] as MathItem<R>;
  const getCalculatedProp = (prop: keyof MathItem<R>["properties"] & string) =>
    mathScope.results.get(id(prop));

  return {
    getItem,
    findButton,
    getButton,
    findTextInput,
    getAllSwatches,
    getCalculatedProp,
  };
};

test("short clicks on indicator toggle visibility", async () => {
  const { findButton, getCalculatedProp } = await setup(MIT.Point);
  expect(getCalculatedProp("visible")).toBe(true);
  await user.click(await findButton());
  expect(getCalculatedProp("visible")).toBe(false);
  await user.click(await findButton());
  expect(getCalculatedProp("visible")).toBe(true);
});

test("long press opens color picker dialog", async () => {
  const { findButton, getCalculatedProp, getAllSwatches } = await setup(
    MIT.Point,
  );
  expect(getCalculatedProp("visible")).toBe(true);
  expect(screen.queryByRole("dialog")).toBe(null);
  await longClick(await findButton(), 500);
  expect(screen.getByRole("dialog")).toBeDefined();
  // Still visible; long-press does not trigger normal click handler
  expect(getCalculatedProp("visible")).toBe(true);
  const swatches = await getAllSwatches();
  expect(swatches).toHaveLength(10);
});

test("clicking a swatch sets item to that color", async () => {
  const { findButton, getItem, getAllSwatches } = await setup(MIT.Point);
  expect(getItem().properties.color).toBe("#3090ff");
  await longClick(await findButton(), 500);
  const swatches = await getAllSwatches();
  await user.click(swatches[8]);
  expect(getItem().properties.color).toBe("#e74c3c");
});

test("Setting colorExpr for surfaces", async () => {
  const { getButton, getItem } = await setup(MIT.ParametricSurface, {
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
  await longClick(getButton(), 500);

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
