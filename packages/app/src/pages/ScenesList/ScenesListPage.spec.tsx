import { renderTestApp, screen, waitFor, user, act, within } from "@/test_util";
import { http, HttpResponse } from "msw";
import { seedDb } from "@math3d/mock-api";
import { server } from "@math3d/mock-api/node";
import { test, expect } from "vitest";

test("the scenes dialog opens via ?overlay=scenes&list=examples, focusing the selected tab", async () => {
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
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
  renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
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
  renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  await screen.findByRole("link", { name: examples[1].title });

  const titles = within(screen.getByRole("list"))
    .getAllByRole("link")
    .map((link) => link.textContent);
  expect(titles.slice(-2)).toEqual(examples.map((e) => e.title));
});

test("a failed examples request offers a retry", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const example = seedDb.withExampleScene();
  server.use(
    http.get(
      "*/v1/examples/scenes/",
      () => HttpResponse.json({ detail: "Server Error" }, { status: 500 }),
      { once: true },
    ),
  );
  renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);

  await user.click(await screen.findByRole("button", { name: "Retry" }));

  expect(
    await screen.findByRole("link", { name: example.title }),
  ).toBeVisible();
});

test("signed in, My Scenes is the first tab", async () => {
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}?overlay=scenes&list=examples`, {
    isAuthenticated: true,
  });
  await screen.findByRole("tab", { name: "My Scenes" });
  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "My Scenes",
    "Examples",
  ]);
});

test("choosing an example opens it, keeping the drawer open with focus on the card", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const example = seedDb.withExampleScene();
  const { location } = renderTestApp(
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

test("an unknown ?list= value self-corrects to list=examples", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(
    `/${scene.key}?overlay=scenes&list=garbage`,
  );
  expect(await screen.findByRole("tab", { name: "Examples" })).toBeVisible();
  await waitFor(() =>
    expect(location.current.search).toContain("list=examples"),
  );
});

test("closing the dialog (Escape) returns to the scene", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(
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
  const { location, router } = renderTestApp(`/${scene.key}`);
  // Open the dialog from the user menu (a push → 2 entries). This scene is
  // viewed signed out, so the trigger is the hamburger.
  await user.click(await screen.findByRole("button", { name: "Open Menu" }));
  await user.click(await screen.findByRole("menuitem", { name: "Examples" }));
  await screen.findByRole("tab", { name: "Examples", selected: true });
  // Switch lists (a replace → still 2 entries).
  await user.click(screen.getByRole("tab", { name: "My Scenes" }));
  await screen.findByRole("tab", { name: "My Scenes", selected: true });

  await act(() => router.navigate(-1));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});
