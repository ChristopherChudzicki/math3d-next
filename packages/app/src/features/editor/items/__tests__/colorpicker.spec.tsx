import {
  MathItem,
  MathItemType as MIT,
  isMathGraphic,
} from "@math3d/mathitem-configs";
import { act, renderTestApp, screen, waitFor, within } from "@/test_util";
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
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = renderTestApp(`/${scene.key}`);

  const findButton = () =>
    screen.findByRole("button", { name: "Show Graphic" });
  const findTextInput = () => screen.findByTitle("Custom Color Input");
  const getAllSwatches = () => {
    const dialog = screen.getByRole("dialog", { name: "Color" });
    return within(dialog).getAllByRole("button", {
      name: (name) => name !== "Close",
    });
  };
  const openDialog = async () => {
    await getTimedEvents(user).pointerPrimary({
      target: await findButton(),
      duration: 500,
    });
    return screen.findByRole("dialog", { name: "Color" });
  };
  const getItem = () => store.getState().scene.items[item.id] as MathItem<R>;

  return {
    user,
    getItem,
    findButton,
    findTextInput,
    getAllSwatches,
    openDialog,
  };
};

test("short clicks on indicator toggle visibility", async () => {
  const { findButton, getItem, user } = await setup(MIT.Point);
  const button = await findButton();
  expect(getItem().properties.visible).toBe(true);
  await user.click(button);
  expect(getItem().properties.visible).toBe(false);
  await user.click(await findButton());
  expect(getItem().properties.visible).toBe(true);
});

test("long press opens color picker dialog", async () => {
  const { findButton, getItem, getAllSwatches, user } = await setup(MIT.Point);
  const timedEvents = getTimedEvents(user);
  const button = await findButton();
  expect(getItem().properties.visible).toBe(true);
  expect(screen.queryByRole("dialog")).toBe(null);
  await timedEvents.pointerPrimary({
    target: button,
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

  const button = await findButton();
  expect(getItem().properties.color).toBe("#3090ff");
  await timedEvents.pointerPrimary({
    target: button,
    duration: 500,
  });
  const swatches = await getAllSwatches();
  await user.click(swatches[8]);
  expect(getItem().properties.color).toBe("#e74c3c");
});

test.each([
  { key: "Enter", hold: "{Enter>8}", release: "{/Enter}" },
  { key: "Space", hold: "[Space>8]", release: "[/Space]" },
])(
  "holding $key on the indicator opens the color dialog while held and leaves it open",
  async ({ hold, release }) => {
    const { findButton, getItem } = await setup(MIT.Point);
    // Spaced keydowns, so the held key repeats past the long-press threshold.
    const user = userEvent.setup({ delay: 100 });
    const button = await findButton();
    const { color, visible } = getItem().properties;
    act(() => button.focus());

    await user.keyboard(hold);
    const dialog = await screen.findByRole("dialog", { name: "Color" });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Close" }),
      ).toHaveFocus(),
    );
    await user.keyboard(release);

    expect(dialog).toBeInTheDocument();
    expect(getItem().properties).toMatchObject({ color, visible });
  },
);

test("Escape closes the color dialog", async () => {
  const { openDialog, user } = await setup(MIT.Point);
  const dialog = await openDialog();

  await user.keyboard("{Escape}");

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
});

test("Tab cycles within the color dialog", async () => {
  const { openDialog, user } = await setup(MIT.Point);
  const dialog = await openDialog();
  await user.click(
    within(dialog).getByRole("textbox", { name: "Custom Color" }),
  );

  await user.tab();

  await waitFor(() =>
    expect(within(dialog).getByRole("button", { name: "Close" })).toHaveFocus(),
  );
});

test("clicking the indicator while the color dialog is open only closes the dialog", async () => {
  const { findButton, getItem, openDialog, user } = await setup(MIT.Point);
  const button = await findButton();
  const dialog = await openDialog();

  await user.click(button);

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(getItem().properties.visible).toBe(true);
});

test("the Color setting in More Settings opens a nested color dialog", async () => {
  const { getItem, user } = await setup(MIT.Point);
  await user.click(
    await screen.findByRole("button", { name: "More Settings" }),
  );
  const settings = await screen.findByRole("dialog", {
    name: "Point Settings",
  });

  await user.click(
    within(settings).getByRole("button", { name: "Color Blue" }),
  );
  const colorDialog = await screen.findByRole("dialog", { name: "Color" });
  await user.click(within(colorDialog).getByRole("button", { name: "Red" }));
  expect(getItem().properties.color).toBe("#e74c3c");

  await user.keyboard("{Escape}");

  await waitFor(() => expect(colorDialog).not.toBeInTheDocument());
  expect(settings).toBeInTheDocument();
  within(settings).getByRole("button", { name: "Color Red" });
});

const graphicTypes = Object.values(MIT).filter((type) =>
  isMathGraphic(makeItem(type)),
);

test.each(graphicTypes)("More Settings for %s lists Color", async (type) => {
  const { user } = await setup(type);

  await user.click(
    await screen.findByRole("button", { name: "More Settings" }),
  );

  const settings = await screen.findByRole("dialog", { name: /Settings$/ });
  within(settings).getByRole("button", { name: /^Color / });
});

test("Setting colorExpr for surfaces", async () => {
  const { findButton, getItem, user } = await setup(MIT.ExplicitSurface, {
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
    target: await findButton(),
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
