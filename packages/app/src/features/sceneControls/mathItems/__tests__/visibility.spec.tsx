import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { renderTestApp, screen, user, within } from "@/test_util";
import * as _ from "lodash-es";
import { seedDb, makeItem } from "@math3d/mock-api";
import type { MathItem, MathItemType } from "@math3d/mathitem-configs";
import {
  addItem,
  clickRemoveItem,
  getActiveItem,
  getItemByDescription,
  getItemByTestId,
  findItemByTestId,
} from "./__utils__";

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
    const { store } = await renderTestApp(`/${scene.key}`);

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

  test.each([{ visible: false }, { visible: true }])(
    "Clicking 'Show Graphic' turns useCalculatedVisibility off",
    async ({ visible }) => {
      const { ui, getPointData } = await setup({
        visible,
        booleanRhs: "true",
        useCalculatedVisibility: true,
      });
      const showPoint = await within(ui.point).findByRole("button", {
        name: "Show Graphic",
      });
      await user.click(showPoint);
      expect(getPointData().properties).toEqual(
        expect.objectContaining({
          useCalculatedVisibility: false,
          visible: !visible,
        }),
      );
    },
  );

  test.each([{ visible: false }, { visible: true }])(
    "Clicking 'Show Graphic' turns useCalculatedVisibility off",
    async ({ visible }) => {
      const { ui, getPointData } = await setup({
        visible,
        booleanRhs: "true",
        useCalculatedVisibility: false,
      });
      await user.click(
        within(ui.boolean).getByRole("checkbox", { name: "Value" }),
      );
      expect(getPointData().properties).toEqual(
        expect.objectContaining({
          useCalculatedVisibility: true,
          visible,
        }),
      );
    },
  );
});
