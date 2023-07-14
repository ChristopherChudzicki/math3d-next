import { test, expect } from "vitest";
import { renderTestApp, screen, user } from "@/test_util";
import invariant from "tiny-invariant";

test.each([
  {
    url: "/?controls=1",
    controlsVisible: true,
    expectedInert: null,
    expectedHidden: null,
  },
  {
    url: "/",
    controlsVisible: true,
    expectedInert: null,
    expectedHidden: null,
  },
  {
    url: "/?controls=0",
    controlsVisible: false,
    expectedInert: "true",
    expectedHidden: "true",
  },
])(
  "'controls' URL query parameter controls whether the controls are visible",
  async ({ controlsVisible, url, expectedHidden, expectedInert }) => {
    await renderTestApp(url);
    const expandBtn = screen.queryByRole("button", { name: "Expand Controls" });
    const collapseBtn = screen.queryByRole("button", {
      name: "Collapse Controls",
    });

    expect(!!expandBtn).toBe(!controlsVisible);
    expect(!!collapseBtn).toBe(controlsVisible);

    const btn = expandBtn ?? collapseBtn;
    invariant(btn, "Expected either expand or collapse button");
    const controlsId = btn.getAttribute("aria-controls");
    invariant(controlsId, "Expected aria-controls attribute");
    const controls = document.getElementById(controlsId);

    expect(controls?.getAttribute("inert")).toBe(expectedInert);
    expect(controls?.getAttribute("aria-hidden")).toBe(expectedHidden);
  }
);

test("Clicking the 'Expand/Collapse Controls' button toggles the controls and preserves hash", async () => {
  const { location } = await renderTestApp("#foo");
  const btn = screen.getByRole("button", { name: "Collapse Controls" });
  expect(location.current).toMatchObject({
    hash: "#foo",
    search: "",
  });
  await user.click(btn);
  expect(location.current).toMatchObject({
    hash: "#foo",
    search: "?controls=0",
  });
  await user.click(btn);
  expect(location.current).toMatchObject({
    hash: "#foo",
    search: "",
  });
});
