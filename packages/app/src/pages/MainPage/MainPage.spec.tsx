import { test, expect } from "vitest";
import { seedDb } from "@math3d/mock-api";
import {
  renderTestApp,
  screen,
  user,
  waitFor,
  waitForAppReady,
  within,
} from "@/test_util";
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
  ({ controlsVisible, url, expectedHidden, expectedInert }) => {
    renderTestApp(url);
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
  const { location } = renderTestApp("#foo");
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

test("Sets the document title from the loaded scene's title", async () => {
  const scene = seedDb.withSceneFromItems([], { title: "My Torus" });
  renderTestApp(`/${scene.key}`);
  await waitFor(() => {
    expect(document.title).toBe("Math3d - My Torus");
  });
});

test("Leaves the static document title untouched when no scene is loaded", async () => {
  // The static <title> baked into index.html is the crawler/link-preview title.
  // On the home/new-scene route (no scene key) the loader must not clobber it.
  document.title = "Static Head Title";
  const { queryClient } = renderTestApp("/");
  await waitForAppReady(queryClient);
  expect(document.title).toBe("Static Head Title");
});

test("Alerts and redirects home when the scene key is not found", async () => {
  // MSW returns 404 for an unknown scene key; useScene surfaces it as an
  // ApiError, which SceneControls maps to a "Not found" alert + redirect to "/".
  // The scene never loads (controls stay busy), so we key off the alert dialog.
  const { location } = renderTestApp("/nonexistent-scene-key");

  const dialog = await screen.findByRole("dialog");
  expect(dialog).toHaveTextContent("Not found");

  await user.click(within(dialog).getByRole("button", { name: "OK" }));

  await waitFor(() => {
    expect(location.current.pathname).toBe("/");
  });
});
