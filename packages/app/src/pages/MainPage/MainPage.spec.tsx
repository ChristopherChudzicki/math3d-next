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
    // Matches the format the OG Worker writes into <title> at the edge, so a
    // deep-linked scene shows the same tab title before and after app boot.
    expect(document.title).toBe("My Torus | Math3d");
  });
});

test("No-scene default falls back to document.title when default-title meta is absent", async () => {
  // Dev/tests may ship no <meta name="default-title">; the loader then falls
  // back to the static <title> and must not clobber it on the home route.
  document.title = "Static Head Title";
  const { queryClient } = renderTestApp("/");
  await waitForAppReady(queryClient);
  expect(document.title).toBe("Static Head Title");
});

test("No-scene default reads the default-title meta when present", async () => {
  // The OG Worker rewrites <title> per-scene but leaves <meta name="default-title">
  // untouched, so the loader sources its no-scene default from the meta — not from
  // a possibly Worker-rewritten <title>.
  document.title = "Some Scene | Math3d"; // simulate a Worker-rewritten <title>
  const meta = document.createElement("meta");
  meta.setAttribute("name", "default-title");
  meta.setAttribute("content", "Math3d: Online 3d Graphing Calculator");
  document.head.appendChild(meta);

  try {
    const { queryClient } = renderTestApp("/");
    await waitForAppReady(queryClient);
    expect(document.title).toBe("Math3d: Online 3d Graphing Calculator");
  } finally {
    meta.remove();
  }
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
