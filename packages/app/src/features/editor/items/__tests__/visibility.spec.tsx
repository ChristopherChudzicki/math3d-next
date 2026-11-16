import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { renderTestApp, user, within } from "@/test_util";
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
    "Clicking 'Show Graphic' flips what's shown and sets visibility by hand (visible: $visible, expression: $booleanRhs)",
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

  test.each([{ booleanRhs: "true" }, { booleanRhs: "false" }])(
    "Toggling a boolean the expression reads hands visibility back to it (from $booleanRhs)",
    async ({ booleanRhs }) => {
      const { ui, getPointData } = await setup({
        booleanRhs,
        useCalculatedVisibility: false,
      });
      await user.click(
        within(ui.boolean).getByRole("switch", { name: "Value" }),
      );
      expect(getPointData().properties).toEqual(
        expect.objectContaining({ useCalculatedVisibility: true }),
      );
    },
  );

  test("An item on the Setup tab follows its expression again while Main is showing", async () => {
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
});
