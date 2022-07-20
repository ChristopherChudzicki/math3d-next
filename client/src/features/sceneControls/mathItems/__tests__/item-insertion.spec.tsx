import { IntegrationTest, screen, user, within } from "test_util";
import _ from "lodash";
import { addItem, getItemByDescription, folderFixture } from "./utils";

test("setup renders 9 points in 3 folders", async () => {
  const helper = new IntegrationTest();
  helper.patchStore(folderFixture());
  helper.render();
  const descriptions = screen
    .getAllByTitle("Description")
    .map((x) => x.textContent);
  const expected = "F1 P1a P1b F2 P2a P2b F3 P3a P3b".split(" ");
  expect(descriptions).toStrictEqual(expected);
});

const activateItem = (description: string): (() => Promise<void>) => {
  return async () => {
    const item = getItemByDescription(description);
    const descriptionField = within(item).getByTitle("Description");
    await user.click(descriptionField);
  };
};

test.each([
  {
    beforeAdd: () => {},
    itemToAdd: "Point",
    expected: "F1 P1a P1b F2 P2a P2b F3 P3a P3b Point",
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
    expected: "F1 P1a P1b F2 P2a P2b Point F3 P3a P3b",
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
  const helper = new IntegrationTest();
  helper.patchStore(folderFixture());
  helper.render();

  await beforeAdd();
  await addItem(itemToAdd);

  const descriptions = screen
    .getAllByTitle("Description")
    .map((x) => x.textContent);

  expect(descriptions).toHaveLength(10);
  expect(descriptions).toStrictEqual(expected.split(" "));
});

test("Newly inserted item is activated", async () => {
  const helper = new IntegrationTest();
  helper.patchStore(folderFixture());
  helper.render();

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
    .getAllByTitle("Description")
    .map((x) => x.textContent);

  const expected = "F1 P1a P1b F2 P2a Point Line P2b F3 P3a P3b";
  expect(descriptions).toHaveLength(11);
  expect(descriptions).toStrictEqual(expected.split(" "));
});
