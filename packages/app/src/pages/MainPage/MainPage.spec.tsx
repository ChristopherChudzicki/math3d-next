import { test, expect } from "vitest";
import { HttpResponse, http } from "msw";
import { onlineManager } from "@tanstack/react-query";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import {
  act,
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

test("Uses the site default title for an untitled scene", async () => {
  // An untitled scene reads like the home page — the rich site default —
  // matching what the OG Worker leaves in <title> at the edge.
  document.title = "Math3d: Online 3d Graphing Calculator";
  const scene = seedDb.withSceneFromItems([], { title: "" });
  const { queryClient } = renderTestApp(`/${scene.key}`);
  await waitForAppReady(queryClient);
  expect(document.title).toBe("Math3d: Online 3d Graphing Calculator");
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
  // MSW returns 404 for an unknown scene key, which useSceneLoader maps to a
  // "Not found" alert + redirect to "/".
  const { location } = renderTestApp("/nonexistent-scene-key");

  const dialog = await screen.findByRole("alertdialog", { name: "Not found" });

  await user.click(within(dialog).getByRole("button", { name: "OK" }));

  await waitFor(() => {
    expect(location.current.pathname).toBe("/");
  });
});

const sceneControls = () =>
  screen.queryByRole("tablist", { name: "Scene controls" });

test("Offers a retry when the scene fails to load, keeping it up while retrying", async () => {
  const scene = seedDb.withSceneFromItems([]);
  let respond = () => {};
  const responded = new Promise<void>((resolve) => {
    respond = resolve;
  });
  server.use(
    http.get(
      urls.scenes.detail,
      () => new HttpResponse(null, { status: 500 }),
      { once: true },
    ),
  );
  const { store } = renderTestApp(`/${scene.key}`);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Couldn’t load this scene.");
  expect(sceneControls()).toBeNull();

  server.use(
    http.get(
      urls.scenes.detail,
      async () => {
        await responded;
        return HttpResponse.json(scene);
      },
      { once: true },
    ),
  );
  const retry = within(alert).getByRole("button", { name: "Retry" });
  await user.click(retry);

  expect(retry).toHaveFocus();
  expect(retry).toHaveAttribute("aria-disabled", "true");
  expect(sceneControls()).toBeNull();

  respond();

  await waitFor(() => expect(store.getState().scene.key).toBe(scene.key));
  expect(sceneControls()).not.toBeNull();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("Says the scene will load once back online", async () => {
  const scene = seedDb.withSceneFromItems([]);
  onlineManager.setOnline(false);
  try {
    const { store } = renderTestApp(`/${scene.key}`);
    expect(
      await screen.findByText(
        "You’re offline. This scene will load when you reconnect.",
      ),
    ).toBeInTheDocument();
    expect(sceneControls()).toBeNull();

    act(() => onlineManager.setOnline(true));

    await waitFor(() => expect(store.getState().scene.key).toBe(scene.key));
    expect(sceneControls()).not.toBeNull();
  } finally {
    onlineManager.setOnline(true);
  }
});
