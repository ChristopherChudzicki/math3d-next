import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";
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
    expectedInert: "", // boolean attributes are either present ("") or not (null)
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
  },
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

test("Alerts and redirects home when the scene key is not found", async () => {
  // MSW returns 404 for an unknown scene key; useScene surfaces it as an
  // ApiError, which SceneControls maps to a "Not found" alert + redirect to "/".
  // waitForReady is skipped: the scene never loads, so the controls stay busy —
  // we key off the alert dialog instead.
  const { location } = await renderTestApp("/nonexistent-scene-key", {
    waitForReady: false,
  });

  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Not found");

  await user.click(within(dialog).getByRole("button", { name: "OK" }));

  await waitFor(() => {
    expect(location.current.pathname).toBe("/");
  });
});
