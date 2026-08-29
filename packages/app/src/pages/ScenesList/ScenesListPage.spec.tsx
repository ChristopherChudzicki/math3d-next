import { renderTestApp, screen, waitFor, user, act } from "@/test_util";
import { seedDb } from "@math3d/mock-api";
import { test, expect } from "vitest";

test("scenes drawer opens via ?overlay=scenes&list=examples", async () => {
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  expect(await screen.findByRole("tab", { name: "Examples" })).toBeVisible();
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

test("closing the drawer (Escape) returns to the scene", async () => {
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

test("switching tabs replaces history; Back leaves the drawer entirely", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location, router } = renderTestApp(`/${scene.key}`);
  // Open the drawer from the user menu (a push → 2 entries). The trigger is the
  // avatar, not the hamburger: UserMenu shows the hamburger only when
  // DISPLAY_AUTH_FLOWS is false, and the jsdom project pins it true.
  await user.click(
    await screen.findByRole("button", { name: "Open User Menu" }),
  );
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
