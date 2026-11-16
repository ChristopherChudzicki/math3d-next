import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";
import * as _ from "lodash-es";
import { seedDb, makeItem } from "@math3d/mock-api";
import { findItemByTestId } from "@/test_util/mathItems";

describe("Visible and calculatedVisibility", () => {
  const setup = async ({
    booleanRhs = "true",
    visible = true,
    useCalculatedVisibility = false,
    calculatedVisibility = "foo",
  } = {}) => {
    const initialItems = {
      boolean: makeItem(MIT.BooleanVariable, {
        value: { lhs: "foo", rhs: booleanRhs, type: "assignment" },
      }),
      point: makeItem(MIT.Point, {
        calculatedVisibility,
        visible,
        useCalculatedVisibility,
      }),
    };
    const scene = seedDb.withSceneFromItems([
      initialItems.boolean,
      initialItems.point,
    ]);
    const { store } = renderTestApp(`/${scene.key}`);

    const getPointData = () =>
      store.getState().scene.items[initialItems.point.id];

    const point = await findItemByTestId(initialItems.point.id);
    const boolean = await findItemByTestId(initialItems.boolean.id);

    return { ui: { point, boolean }, getPointData };
  };

  test.each([
    {
      visible: true,
      booleanRhs: "false",
      useCalculatedVisibility: false,
      expectedVisible: true,
    },
    {
      visible: false,
      booleanRhs: "true",
      useCalculatedVisibility: false,
      expectedVisible: false,
    },
    {
      visible: true,
      booleanRhs: "false",
      useCalculatedVisibility: true,
      expectedVisible: false,
    },
    {
      visible: false,
      booleanRhs: "true",
      useCalculatedVisibility: true,
      expectedVisible: true,
    },
  ])(
    "Visible and calculatedVisibility switch appropriately",
    async ({
      visible,
      booleanRhs,
      useCalculatedVisibility,
      expectedVisible,
    }) => {
      const { ui } = await setup({
        visible,
        booleanRhs,
        useCalculatedVisibility,
      });
      const showPoint = await within(ui.point).findByRole("button", {
        name: "Show Graphic",
      });
      expect(showPoint).toHaveAttribute(
        "aria-pressed",
        String(expectedVisible),
      );
    },
  );

  test("A calculated visibility that errors shows the graphic", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const { ui } = await setup({
      visible: false,
      useCalculatedVisibility: true,
      calculatedVisibility: "undefinedName",
    });
    const showPoint = await within(ui.point).findByRole("button", {
      name: "Show Graphic",
    });
    expect(showPoint).toHaveAttribute("aria-pressed", "true");
  });

  test.each([{ visible: true }, { visible: false }])(
    "A blank calculated visibility defers to visible ($visible)",
    async ({ visible }) => {
      const { ui } = await setup({
        visible,
        useCalculatedVisibility: true,
        calculatedVisibility: "",
      });
      const showPoint = await within(ui.point).findByRole("button", {
        name: "Show Graphic",
      });
      expect(showPoint).toHaveAttribute("aria-pressed", String(visible));
    },
  );

  test.each([
    { visible: false, booleanRhs: "true" },
    { visible: true, booleanRhs: "false" },
  ])(
    "Clicking 'Show Graphic' flips what's shown and sets visibility by hand (stored visible: $visible, expression: $booleanRhs)",
    async ({ visible, booleanRhs }) => {
      const { ui, getPointData } = await setup({
        visible,
        booleanRhs,
        useCalculatedVisibility: true,
      });
      const showPoint = await within(ui.point).findByRole("button", {
        name: "Show Graphic",
      });
      const shown = booleanRhs === "true";
      expect(showPoint).toHaveAttribute("aria-pressed", String(shown));
      await user.click(showPoint);
      expect(showPoint).toHaveAttribute("aria-pressed", String(!shown));
      expect(getPointData().properties).toEqual(
        expect.objectContaining({
          useCalculatedVisibility: false,
          visible: !shown,
        }),
      );
    },
  );

  test("Flipping a toggle the expression reads hands visibility back to it", async () => {
    const { ui, getPointData } = await setup({
      booleanRhs: "false",
      useCalculatedVisibility: false,
    });
    await user.click(within(ui.boolean).getByRole("switch", { name: "Value" }));
    expect(getPointData().properties).toEqual(
      expect.objectContaining({ useCalculatedVisibility: true }),
    );
  });

  test("A manual item on the Setup tab follows its expression once a toggle on Main flips", async () => {
    const boolean = makeItem(MIT.BooleanVariable, {
      value: { lhs: "foo", rhs: "false", type: "assignment" },
    });
    const main = makeItem(MIT.Folder);
    const setupFolder = makeItem(MIT.Folder);
    const axis = makeItem(
      MIT.Axis,
      { calculatedVisibility: "foo", useCalculatedVisibility: false },
      "axis-x",
    );
    const { key } = seedDb.withScene({
      items: [main, boolean, setupFolder, axis],
      itemOrder: {
        main: [main.id],
        [main.id]: [boolean.id],
        setup: [setupFolder.id],
        [setupFolder.id]: [axis.id],
      },
    });
    const { store } = renderTestApp(`/${key}`);

    const ui = await findItemByTestId(boolean.id);
    await user.click(within(ui).getByRole("switch", { name: "Value" }));

    expect(store.getState().scene.items[axis.id].properties).toEqual(
      expect.objectContaining({ useCalculatedVisibility: true }),
    );
  });

  test.each([
    {
      useCalculatedVisibility: true,
      calculatedVisibility: "foo",
      badge: "Calculated Visibility: following",
    },
    {
      useCalculatedVisibility: false,
      calculatedVisibility: "foo",
      badge: "Calculated Visibility: set by hand",
    },
    {
      useCalculatedVisibility: true,
      calculatedVisibility: "undefinedName",
      badge: "Calculated Visibility: error",
    },
  ])(
    "The badge names what decides visibility: '$badge'",
    async ({ useCalculatedVisibility, calculatedVisibility, badge }) => {
      if (calculatedVisibility === "undefinedName") {
        vi.spyOn(console, "warn").mockImplementation(() => {});
      }
      const { ui } = await setup({
        useCalculatedVisibility,
        calculatedVisibility,
      });
      expect(
        await within(ui.point).findByRole("button", { name: badge }),
      ).toBeInTheDocument();
    },
  );

  test("An item with no expression has no badge", async () => {
    const { ui } = await setup({ calculatedVisibility: "" });
    await within(ui.point).findByRole("button", { name: "Show Graphic" });
    expect(
      within(ui.point).queryByRole("button", { name: /Calculated Visibility/ }),
    ).toBeNull();
  });

  test("The badge's popover explains it and can hand visibility back", async () => {
    const { ui, getPointData } = await setup({
      useCalculatedVisibility: false,
    });
    await user.click(
      await within(ui.point).findByRole("button", {
        name: "Calculated Visibility: set by hand",
      }),
    );
    const popover = await screen.findByRole("dialog");
    expect(popover).toHaveAccessibleDescription(
      "Shown or hidden by hand until its Calculated Visibility changes value:",
    );

    await user.click(
      within(popover).getByRole("switch", {
        name: "Follow Calculated Visibility",
      }),
    );

    expect(getPointData().properties).toEqual(
      expect.objectContaining({ useCalculatedVisibility: true }),
    );
  });

  test("Undo after a click hands visibility back to the expression", async () => {
    const { ui, getPointData } = await setup({
      booleanRhs: "true",
      useCalculatedVisibility: true,
    });
    const showPoint = await within(ui.point).findByRole("button", {
      name: "Show Graphic",
    });
    await user.click(showPoint);
    expect(showPoint).toHaveAttribute("aria-pressed", "false");
    const { description } = getPointData().properties;
    await screen.findByText(`“${description}” hidden by hand.`);

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(getPointData().properties).toEqual(
      expect.objectContaining({ useCalculatedVisibility: true }),
    );
    expect(showPoint).toHaveAttribute("aria-pressed", "true");
  });

  test("Follow Calculated Visibility switch: off keeps what's shown, on follows the expression", async () => {
    const { ui, getPointData } = await setup({
      booleanRhs: "false",
      useCalculatedVisibility: true,
    });
    await user.click(
      within(ui.point).getByRole("button", { name: "More Settings" }),
    );
    const follow = await screen.findByRole("switch", {
      name: "Follow Calculated Visibility",
    });
    expect(follow).toBeChecked();

    await user.click(follow);
    expect(getPointData().properties).toEqual(
      expect.objectContaining({
        useCalculatedVisibility: false,
        visible: false,
      }),
    );

    await user.click(follow);
    expect(getPointData().properties).toEqual(
      expect.objectContaining({ useCalculatedVisibility: true }),
    );
  });

  test("The notice closes once the expression takes over again", async () => {
    const { ui } = await setup({
      booleanRhs: "true",
      useCalculatedVisibility: true,
    });
    await user.click(
      await within(ui.point).findByRole("button", { name: "Show Graphic" }),
    );
    const undo = await screen.findByRole("button", { name: "Undo" });

    await user.click(within(ui.boolean).getByRole("switch", { name: "Value" }));

    await waitFor(() => expect(undo).not.toBeInTheDocument());
  });

  test("Clicking a manual item shows no notice", async () => {
    const { ui } = await setup({ useCalculatedVisibility: false });
    await user.click(
      await within(ui.point).findByRole("button", { name: "Show Graphic" }),
    );
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  test("Follow Calculated Visibility is disabled with no expression", async () => {
    const { ui } = await setup({ calculatedVisibility: "" });
    await user.click(
      within(ui.point).getByRole("button", { name: "More Settings" }),
    );
    expect(
      await screen.findByRole("switch", {
        name: "Follow Calculated Visibility",
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });
});
