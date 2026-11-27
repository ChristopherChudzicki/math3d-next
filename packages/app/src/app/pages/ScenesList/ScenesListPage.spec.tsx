import {
  renderTestApp,
  screen,
  waitFor,
  user,
  within,
  matchMediaQueries,
} from "@/test_util";
import { goBack } from "@/test_util/routerTesting";
import { http, HttpResponse } from "msw";
import { seedDb } from "@math3d/mock-api";
import { server } from "@math3d/mock-api/node";
import { beforeEach, describe, test, expect, vi } from "vitest";

// The drawer's 672px width, spelled out so a wrong unit or width in
// fillsViewportQuery fails.
const DRAWER_COVERS_SCENE = "(max-width: 672px)";

test("the scenes dialog opens via ?overlay=scenes&list=examples, focusing the selected tab", async () => {
  const scene = seedDb.withSceneFromItems([]);
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  expect(
    await screen.findByRole("dialog", { name: "Scenes" }),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(screen.getByRole("tab", { name: "Examples" })).toHaveFocus(),
  );
});

test("Tab goes from the close button straight to the first card", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const example = seedDb.withExampleScene();
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  await screen.findByRole("link", { name: example.title });
  const close = screen.getByRole("button", { name: "Close" });
  close.focus();

  await user.tab();

  const [firstCard] = within(screen.getByRole("list")).getAllByRole("link");
  expect(firstCard).toHaveFocus();
});

test("examples are listed in order, as the API returns them", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const examples = [seedDb.withExampleScene(), seedDb.withExampleScene()];
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  await screen.findByRole("link", { name: examples[1].title });

  const titles = within(screen.getByRole("list"))
    .getAllByRole("link")
    .map((link) => link.textContent);
  expect(titles.slice(-2)).toEqual(examples.map((e) => e.title));
});

test("a failed examples request offers to try again", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const example = seedDb.withExampleScene();
  server.use(
    http.get(
      "*/v1/examples/scenes/",
      () => HttpResponse.json({ detail: "Server Error" }, { status: 500 }),
      { once: true },
    ),
  );
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);

  await user.click(await screen.findByRole("button", { name: "Try again" }));

  expect(
    await screen.findByRole("link", { name: example.title }),
  ).toBeVisible();
});

test("with no examples, the tab says so", async () => {
  const scene = seedDb.withSceneFromItems([]);
  server.use(
    http.get("*/v1/examples/scenes/", () =>
      HttpResponse.json({ count: 0, items: [] }),
    ),
  );
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);

  expect(await screen.findByText("No examples yet.")).toBeVisible();
});

test("signed in, the tabs are My Scenes, Examples, then Unsaved", async () => {
  const scene = seedDb.withSceneFromItems([]);
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`, {
    isAuthenticated: true,
  });
  await screen.findByRole("tab", { name: "My Scenes" });
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "My Scenes",
    "Examples",
    "Unsaved",
  ]);
});

test("beside the scene, choosing an example opens it, keeping the drawer open with focus on the card", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const example = seedDb.withExampleScene();
  const { location } = await renderTestApp(
    `/${scene.key}?overlay=scenes&list=examples`,
  );
  const card = await screen.findByRole("link", { name: example.title });

  await user.click(card);

  await waitFor(() =>
    expect(location.current.pathname).toBe(`/${example.key}`),
  );
  expect(location.current.search).toBe("?overlay=scenes&list=examples");
  expect(card).toHaveFocus();
  expect(card).toHaveAttribute("aria-current", "page");
});

test.each([
  {
    from: "controls=0&utm_source=feed",
    carried: "&controls=0",
  },
  { from: "controls=1", carried: "" },
])(
  "a card's link keeps only controls=0 from ?$from",
  async ({ from, carried }) => {
    const scene = seedDb.withSceneFromItems([]);
    const example = seedDb.withExampleScene();
    await renderTestApp(`/${scene.key}?${from}&overlay=scenes&list=examples`);

    expect(
      await screen.findByRole("link", { name: example.title }),
    ).toHaveAttribute(
      "href",
      `/${example.key}?overlay=scenes&list=examples${carried}`,
    );
  },
);

test("an unknown ?list= value is dropped and shows Examples", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(
    `/${scene.key}?overlay=scenes&list=garbage`,
  );
  expect(
    await screen.findByRole("tab", { name: "Examples", selected: true }),
  ).toBeVisible();
  expect(location.current.search).toBe("?overlay=scenes");
  expect(error).toHaveBeenCalledWith(
    'Invalid value "garbage" for search parameter list',
  );
});

test("closing the dialog (Escape) returns to the scene", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(
    `/${scene.key}?overlay=scenes&list=examples`,
  );
  await screen.findByRole("tab", { name: "Examples" });
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});

test("switching tabs replaces history; Back leaves the dialog entirely", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location, router } = await renderTestApp(`/${scene.key}`);
  // Open the dialog from the user menu (a push → 2 entries). This scene is
  // viewed signed out, so the trigger is the hamburger.
  await user.click(await screen.findByRole("button", { name: "Open Menu" }));
  await user.click(await screen.findByRole("menuitem", { name: "Examples" }));
  await screen.findByRole("tab", { name: "Examples", selected: true });
  // Switch lists (a replace → still 2 entries).
  await user.click(screen.getByRole("tab", { name: "My Scenes" }));
  await screen.findByRole("tab", { name: "My Scenes", selected: true });

  await goBack(router);
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});

describe("where the drawer covers the scene", () => {
  beforeEach(() => matchMediaQueries([DRAWER_COVERS_SCENE]));

  test("choosing an example closes the drawer, and Back reopens it over the previous scene", async () => {
    const scene = seedDb.withSceneFromItems([]);
    const example = seedDb.withExampleScene();
    const { location, router } = await renderTestApp(`/${scene.key}`);
    const openScenes = await screen.findByRole("button", {
      name: "Math3d, open scenes",
    });
    await user.click(openScenes);

    await user.click(await screen.findByRole("link", { name: example.title }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Scenes" })).toBeNull(),
    );
    expect(location.current.pathname).toBe(`/${example.key}`);
    expect(location.current.search).toBe("");
    expect(openScenes).toHaveFocus();

    await goBack(router);
    expect(
      await screen.findByRole("dialog", { name: "Scenes" }),
    ).toBeInTheDocument();
    expect(location.current.pathname).toBe(`/${scene.key}`);
  });

  test("a card's link keeps controls=0", async () => {
    const scene = seedDb.withSceneFromItems([]);
    const example = seedDb.withExampleScene();
    await renderTestApp(
      `/${scene.key}?controls=0&overlay=scenes&list=examples`,
    );

    expect(
      await screen.findByRole("link", { name: example.title }),
    ).toHaveAttribute("href", `/${example.key}?controls=0`);
  });

  test("choosing the open scene closes the drawer, popping its entry", async () => {
    const example = seedDb.withExampleScene();
    const { location, router } = await renderTestApp(`/${example.key}`);
    await user.click(
      await screen.findByRole("button", { name: "Math3d, open scenes" }),
    );

    await user.click(await screen.findByRole("link", { name: example.title }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Scenes" })).toBeNull(),
    );
    expect(location.current.pathname).toBe(`/${example.key}`);
    expect(location.current.search).toBe("");
    expect(router.history.canGoBack()).toBe(false);
  });
});
