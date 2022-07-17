import { IntegrationTest, screen, user, within } from "test_util";
import _ from "lodash";
import { folderFixture, getItemByDescription } from "./utils";

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

test.each([
  { isCollapsed: "false", expectHidden: false, adjective: "visible" },
  { isCollapsed: "true", expectHidden: true, adjective: "hidden" },
])(
  "When isCollapsed is initially $isCollapsed, items are $adjective",
  async ({ isCollapsed, expectHidden }) => {
    const helper = new IntegrationTest();
    helper.patchStore(folderFixture({ F2: { isCollapsed } }));
    helper.render();
    const els = screen.getAllByTitle("Description");
    expect(els[4]).toBeVisible();

    expect(isHidden(getItemByDescription("P2a"))).toBe(expectHidden);
    expect(isHidden(getItemByDescription("P2b"))).toBe(expectHidden);
  }
);

test("Collapsing and expanding folders", async () => {
  const helper = new IntegrationTest();
  helper.patchStore(folderFixture({ F2: { isCollapsed: "true" } }));
  helper.render();
  const els = screen.getAllByTitle("Description");
  expect(els[4]).toBeVisible();

  const folder = getItemByDescription("F2");
  const toggle = within(folder).getByLabelText("Expand/Collapse Folder");

  expect(isHidden(getItemByDescription("P2a"))).toBe(true);
  expect(isHidden(getItemByDescription("P2b"))).toBe(true);

  await user.click(toggle);

  expect(isHidden(getItemByDescription("P2a"))).toBe(false);
  expect(isHidden(getItemByDescription("P2b"))).toBe(false);

  await user.click(toggle);

  expect(isHidden(getItemByDescription("P2a"))).toBe(true);
  expect(isHidden(getItemByDescription("P2b"))).toBe(true);
});
