import { renderTestApp, screen, waitFor, user, act } from "@/test_util";
import { seedDb } from "@math3d/mock-api";
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
  renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  const close = await screen.findByRole("button", { name: "Close" });
  close.focus();

  await user.tab();

  expect(
    screen.getByRole("link", { name: "Using Variable Sliders" }),
  ).toHaveFocus();
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

test("choosing an example opens it and closes the dialog", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(
    `/${scene.key}?overlay=scenes&list=examples`,
  );

  await user.click(
    await screen.findByRole("link", { name: "Using Variable Sliders" }),
  );

  await waitFor(() => expect(location.current.pathname).toBe("/sliders_intro"));
  expect(location.current.search).not.toContain("overlay=");
  expect(screen.queryByRole("dialog", { name: "Scenes" })).toBeNull();
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
