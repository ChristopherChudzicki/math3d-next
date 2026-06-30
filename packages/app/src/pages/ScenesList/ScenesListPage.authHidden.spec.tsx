import { test, expect } from "vitest";
import { renderTestApp, screen, waitFor, within } from "@/test_util";
import { seedDb } from "@math3d/mock-api";

vi.mock("@/features/auth/displayAuthFlows", () => ({
  DISPLAY_AUTH_FLOWS: false,
}));

test("My Scenes tab is hidden for unauthenticated users when DISPLAY_AUTH_FLOWS is false", async () => {
  const scene = seedDb.withSceneFromItems([]);
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  const tablist = await screen.findByRole("tablist", { name: "Scenes" });
  expect(within(tablist).queryByRole("tab", { name: "My Scenes" })).toBeNull();
  expect(
    within(tablist).getByRole("tab", { name: "Examples", selected: true }),
  ).toBeTruthy();
});

test("My Scenes tab is shown for authenticated users even when DISPLAY_AUTH_FLOWS is false", async () => {
  const scene = seedDb.withSceneFromItems([]);
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`, {
    isAuthenticated: true,
  });
  const tablist = await screen.findByRole("tablist", { name: "Scenes" });
  expect(within(tablist).getByRole("tab", { name: "My Scenes" })).toBeTruthy();
});

test("?overlay=scenes&list=me redirects to list=examples when DISPLAY_AUTH_FLOWS is false", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(
    `/${scene.key}?overlay=scenes&list=me`,
  );
  const tablist = await screen.findByRole("tablist", { name: "Scenes" });
  await within(tablist).findByRole("tab", {
    selected: true,
    name: "Examples",
  });
  await waitFor(() => {
    expect(location.current.search).toContain("list=examples");
  });
});
