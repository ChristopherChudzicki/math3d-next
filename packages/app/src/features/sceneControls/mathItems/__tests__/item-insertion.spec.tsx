import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { renderTestApp, screen, user, within } from "@/test_util";
import _ from "lodash-es";
import { seedDb, makeItem } from "@math3d/mock-api";
import {
  addItem,
  clickRemoveItem,
  getActiveItem,
  getItemByDescription,
  getItemByTestId,
} from "./__utils__";

test("setup renders 9 points in 3 folders", async () => {
  await renderTestApp("/test_folders");

  const descriptions = screen
    .getAllByLabelText("Description")
    .map((x) => x.textContent);
  const expected = "F1 P1a P1b F2 P2a P2b F3 P3a P3b".split(" ");
  expect(descriptions).toStrictEqual(expected);
});

const activateItem = (description: string): (() => Promise<void>) => {
  return async () => {
    const item = getItemByDescription(description);
    const descriptionField = within(item).getByLabelText("Description");
    await user.click(descriptionField);
  };
};

test.each([
  {
    beforeAdd: () => {},
    itemToAdd: "Point",
    expected: "F1 P1a P1b F2 P2a P2b F3 Point P3a P3b",
    description: "[active item = None] Point insertion occurs at end",
  },
  {
    beforeAdd: activateItem("P2a"),
    itemToAdd: "Point",
    expected: "F1 P1a P1b F2 P2a Point P2b F3 P3a P3b",
    description: "[active item != Folder] items are inserted after activeItem",
  },
  {
    beforeAdd: activateItem("F2"),
    itemToAdd: "Point",
    expected: "F1 P1a P1b F2 Point P2a P2b F3 P3a P3b",
    description:
      "[active item = folder] items are inserted at end of active folder",
  },
  {
    beforeAdd: () => {},
    itemToAdd: "Folder",
    expected: "F1 P1a P1b F2 P2a P2b F3 P3a P3b Folder",
    description: "[Active Item = None] Folder insertion occurs at end",
  },
  {
    beforeAdd: activateItem("P2a"),
    itemToAdd: "Folder",
    expected: "F1 P1a P1b F2 P2a P2b Folder F3 P3a P3b",
    description:
      "[Active Item != Folder] folders are inserted after activeItem's parent folder",
  },
  {
    beforeAdd: activateItem("F2"),
    itemToAdd: "Folder",
    expected: "F1 P1a P1b F2 P2a P2b Folder F3 P3a P3b",
    description: "[Active Item = Folder] folders are inserted after it",
  },
])("$description", async ({ itemToAdd, expected, beforeAdd }) => {
  await renderTestApp("/test_folders");

  await beforeAdd();
  await addItem(itemToAdd);

  const descriptions = screen
    .getAllByLabelText("Description")
    .map((x) => x.textContent);

  expect(descriptions).toHaveLength(10);
  expect(descriptions).toStrictEqual(expected.split(" "));
});

test("Newly inserted item is activated", async () => {
  await renderTestApp("/test_folders");

  /**
   * The behaviors associated with "being active item" are
   *  - a little bit of styling
   *  - insertion
   *
   * We'll make assertions about the insertion part.
   */

  await activateItem("P2a")();
  await addItem("Point");
  await addItem("Line");

  const descriptions = screen
    .getAllByLabelText("Description")
    .map((x) => x.textContent);

  const expected = "F1 P1a P1b F2 P2a Point Line P2b F3 P3a P3b";
  expect(descriptions).toHaveLength(11);
  expect(descriptions).toStrictEqual(expected.split(" "));
});

test("Inserting items after deletion---active item resets", async () => {
  await renderTestApp("/test_folders");
  const p2b = getItemByDescription("P2b");
  const description = within(p2b).getByLabelText("Description");
  await user.click(description);
  await clickRemoveItem(p2b);
  await addItem("Line");
  const line = getItemByDescription("Line");
  expect(line).toBeDefined();

  const descriptions = screen
    .getAllByLabelText("Description")
    .map((x) => x.textContent);

  /**
   * P2b was active, but then we removed it.
   * ActiveItem should reset, so Line should be at the bottom of the last folder
   */
  const expected = "F1 P1a P1b F2 P2a F3 Line P3a P3b";
  expect(descriptions).toHaveLength(9);
  expect(descriptions).toStrictEqual(expected.split(" "));
});

const permanentItems = [
  {
    itemId: "axes",
  },
  {
    itemId: "axis-x",
  },
];

test.each(permanentItems)(
  "Cannot insert items into permanent folders",
  async ({ itemId }) => {
    // insertion should be allowed but should be into default folder and refocus tab
    const { store } = await renderTestApp("/");
    await user.click(screen.getByRole("tab", { name: "Axes & Camera" }));
    const item = getItemByTestId(itemId);
    const description = within(item).getByLabelText("Description");
    await user.click(description);
    expect(getActiveItem(store)?.id).toBe(itemId);
    const order0 = store.getState().scene.order;
    await addItem("Point");
    const order1 = store.getState().scene.order;
    expect(order1).toEqual({
      ...order0,
      initialFolder: [expect.any(String), ...order0.initialFolder],
    });
  },
);

test.each(permanentItems)("Removing items", async ({ itemId }) => {
  await renderTestApp("/");
  const removeBtnLabel = "Remove Item";
  within(getItemByDescription("Explicit Surface")).getByRole("button", {
    name: removeBtnLabel,
  });
  await user.click(screen.getByRole("tab", { name: "Axes & Camera" }));
  const item = getItemByTestId(itemId);
  const removeBtn = within(item).getByRole("button", {
    name: removeBtnLabel,
  });
  expect(removeBtn).toHaveClass("hidden");
  expect(removeBtn).toBeDisabled();
});

test.each(permanentItems)(
  "Cannot move permanent folders or their items",
  async ({ itemId }) => {
    await renderTestApp("/");
    const surface = getItemByDescription("Explicit Surface");
    expect(
      surface.closest('[aria-roledescription="sortable"]'),
    ).not.toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("tab", { name: "Axes & Camera" }));
    expect(
      getItemByTestId(itemId).closest('[aria-roledescription="sortable"]'),
    ).toHaveAttribute("aria-disabled", "true");
  },
);

test.each([
  {
    items: [makeItem(MIT.Point)],
    isRemoveDisabled: true,
  },
  {
    items: [],
    isRemoveDisabled: false,
  },
])("Cannot delete non-empty folders", async ({ items, isRemoveDisabled }) => {
  const scene = seedDb.withSceneFromItems(items);
  await renderTestApp(`/${scene.key}`);
  const folder = getItemByDescription("Folder");
  const removeBtn = within(folder).getByRole("button", {
    name: "Remove Item",
  }) as HTMLButtonElement;
  expect(removeBtn.disabled).toBe(isRemoveDisabled);
});
