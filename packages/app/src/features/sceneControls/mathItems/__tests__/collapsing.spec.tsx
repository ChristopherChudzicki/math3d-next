import { renderTestApp, screen, user, within } from "@/test_util";
import * as _ from "lodash-es";
import { addItem, getItemByDescription } from "./__utils__";

/**
 * Detect whether an element or one of its ancestors is hidden based on its
 * style including `height:0px overflow-y: hidden`
 *
 * This depends
 */
const isHidden = (el: HTMLElement | null): boolean => {
  if (el === null) return false;
  if (el.style.height === "0px" && el.style.overflowY === "hidden") {
    return true;
  }
  return isHidden(el.parentElement);
};

const getExpandCollapse = (folderElement: HTMLElement) =>
  within(folderElement).getByLabelText("Expand/Collapse Folder");

test.each([
  {
    isCollapsed: "false",
    route: "/test_folders",
    expectHidden: false,
    adjective: "visible",
  },
  {
    isCollapsed: "true",
    route: "/test_folders_F2_collapsed",
    expectHidden: true,
    adjective: "hidden",
  },
])(
  "When isCollapsed is initially $isCollapsed, items are $adjective",
  async ({ route, expectHidden }) => {
    await renderTestApp(route);

    const els = screen.getAllByLabelText("Description");
    expect(els[4]).toBeVisible();

    expect(isHidden(getItemByDescription("P2a"))).toBe(expectHidden);
    expect(isHidden(getItemByDescription("P2b"))).toBe(expectHidden);
  },
);

test("Collapsing and expanding folders", async () => {
  await renderTestApp("/test_folders");
  await user.click(getExpandCollapse(getItemByDescription("F2")));

  const els = screen.getAllByLabelText("Description");
  expect(els[4]).toBeVisible();

  const folder = getItemByDescription("F2");
  const toggle = getExpandCollapse(folder);

  expect(isHidden(getItemByDescription("P2a"))).toBe(true);
  expect(isHidden(getItemByDescription("P2b"))).toBe(true);

  await user.click(toggle);

  expect(isHidden(getItemByDescription("P2a"))).toBe(false);
  expect(isHidden(getItemByDescription("P2b"))).toBe(false);

  await user.click(toggle);

  expect(isHidden(getItemByDescription("P2a"))).toBe(true);
  expect(isHidden(getItemByDescription("P2b"))).toBe(true);
});

test("Inserting into a collapsed folder expands the folder", async () => {
  await renderTestApp("/test_folders");

  const folder = getItemByDescription("F2");
  const toggle = getExpandCollapse(folder);
  await user.click(toggle);

  expect(isHidden(getItemByDescription("P2a"))).toBe(true);
  expect(isHidden(getItemByDescription("P2b"))).toBe(true);

  await addItem("Point");
  const descriptions = screen
    .getAllByLabelText("Description")
    .map((x) => x.textContent);

  const expected = "F1 P1a P1b F2 Point P2a P2b F3 P3a P3b";
  expect(descriptions).toHaveLength(10);
  expect(descriptions).toStrictEqual(expected.split(" "));

  expect(isHidden(getItemByDescription("P2a"))).toBe(false);
  expect(isHidden(getItemByDescription("P2b"))).toBe(false);
  expect(isHidden(getItemByDescription("Point"))).toBe(false);
});
