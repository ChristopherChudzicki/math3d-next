import { test, expect, vi } from "vitest";
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
import * as Sentry from "@sentry/react";
import expectToast from "@/test_util/expectToast";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureException: vi.fn(),
}));

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

const sceneControls = () =>
  screen.queryByRole("tablist", { name: "Scene controls" });

const answer = (status: number) => () =>
  HttpResponse.json({ detail: "boom" }, { status });

test("a 500 shows the failed card, not the error page", async () => {
  const scene = seedDb.withSceneFromItems([]);
  server.use(http.get(urls.scenes.detail, answer(500)));
  renderTestApp(`/${scene.key}`);

  expect(
    await screen.findByRole("heading", { name: "Couldn’t load this scene." }),
  ).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Report this bug" }),
  ).toBeInTheDocument();
  expect(sceneControls()).toBeNull();
  expect(Sentry.captureException).toHaveBeenCalledTimes(1);
});

test("a network failure shows the unreachable card", async () => {
  const scene = seedDb.withSceneFromItems([]);
  server.use(http.get(urls.scenes.detail, () => HttpResponse.error()));
  renderTestApp(`/${scene.key}`);

  expect(
    await screen.findByRole("heading", { name: "Couldn’t reach Math3d." }),
  ).toBeVisible();
});

test("a 404 shows the not-found card at the same URL", async () => {
  const { location } = renderTestApp("/nonexistent-scene-key");

  expect(
    await screen.findByRole("heading", { name: "This scene doesn’t exist." }),
  ).toBeVisible();
  expect(location.current.pathname).toBe("/nonexistent-scene-key");
  expect(document.title).toBe("Not found");
  expect(Sentry.captureException).not.toHaveBeenCalled();
});

test("Try again keeps the card and focus, then focuses the title", async () => {
  const scene = seedDb.withSceneFromItems([]);
  let calls = 0;
  let release = () => {};
  server.use(
    http.get(urls.scenes.detail, async () => {
      calls += 1;
      if (calls === 2) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      }
      // Returning nothing falls through to the default handler.
      return calls <= 2 ? answer(500)() : undefined;
    }),
  );
  renderTestApp(`/${scene.key}`);
  const heading = () =>
    screen.getByRole("heading", { name: "Couldn’t load this scene." });
  const tryAgain = await screen.findByRole("button", { name: "Try again" });
  const first = heading();

  await user.click(tryAgain);
  await waitFor(() => expect(calls).toBe(2));
  expect(heading()).toBe(first);
  expect(tryAgain).toHaveFocus();

  // The failed retry re-renders the message, so it's announced again.
  act(() => release());
  await waitFor(() => expect(heading()).not.toBe(first));
  expect(tryAgain).toHaveFocus();

  await user.click(tryAgain);
  invariant(scene.title, "seeded scenes have titles");
  const title = await screen.findByRole("heading", { name: scene.title });
  await waitFor(() => expect(title).toHaveFocus());
});

test("from the Scenes drawer, a 404 keeps the drawer open and toasts; opening a scene that loads dismisses it", async () => {
  const current = seedDb.withSceneFromItems([]);
  const missing = seedDb.withExampleScene();
  const working = seedDb.withExampleScene();
  server.use(
    http.get(urls.scenes.detail, ({ params }) =>
      params.key === missing.key ? answer(404)() : undefined,
    ),
  );
  renderTestApp(`/${current.key}?overlay=scenes&list=examples`);
  const dialog = await screen.findByRole("dialog", { name: "Scenes" });

  await user.click(
    await within(dialog).findByRole("link", { name: missing.title }),
  );
  await expectToast("This scene doesn’t exist.");
  expect(screen.getByRole("dialog", { name: "Scenes" })).toBe(dialog);

  await user.click(within(dialog).getByRole("link", { name: working.title }));
  const region = screen.getByRole("region", { name: "Notifications" });
  await waitFor(() =>
    expect(within(region).queryByText("This scene doesn’t exist.")).toBeNull(),
  );
});

test("opening the Scenes drawer over the card doesn't toast", async () => {
  renderTestApp("/nonexistent-scene-key");
  await screen.findByRole("heading", { name: "This scene doesn’t exist." });

  await user.click(screen.getByRole("button", { name: "Open scenes" }));

  await screen.findByRole("dialog", { name: "Scenes" });
  // The toast guard in setupTests fails this test if a toast was shown.
});

test("New scene from not-found loads the default scene and resets the tab title", async () => {
  document.title = "Math3d: Online 3d Graphing Calculator";
  const { location, store } = renderTestApp("/nonexistent-scene-key");

  await user.click(await screen.findByRole("link", { name: "New scene" }));

  await waitFor(() => expect(location.current.pathname).toBe("/"));
  await waitFor(() => expect(store.getState().scene.loaded).toBe(true));
  expect(document.title).toBe("Math3d: Online 3d Graphing Calculator");
});

test("Says the scene will load once back online", async () => {
  const scene = seedDb.withSceneFromItems([]);
  onlineManager.setOnline(false);
  try {
    const { store } = renderTestApp(`/${scene.key}`);
    expect(
      await screen.findByRole("heading", { name: "You’re offline." }),
    ).toBeInTheDocument();
    expect(sceneControls()).toBeNull();

    act(() => onlineManager.setOnline(true));

    await waitFor(() => expect(store.getState().scene.key).toBe(scene.key));
    expect(sceneControls()).not.toBeNull();
  } finally {
    onlineManager.setOnline(true);
  }
});
