import { test, expect } from "vitest";
import { renderTestApp, screen, waitFor, within } from "@/test_util";

vi.mock("@/features/auth/displayAuthFlows", () => ({
  DISPLAY_AUTH_FLOWS: false,
}));

test("My Scenes tab is hidden for unauthenticated users when DISPLAY_AUTH_FLOWS is false", async () => {
  await renderTestApp("/scenes/examples");
  const tablist = await screen.findByRole("tablist", { name: "Scenes" });
  expect(within(tablist).queryByRole("tab", { name: "My Scenes" })).toBeNull();
  expect(
    within(tablist).getByRole("tab", { name: "Examples", selected: true }),
  ).toBeTruthy();
});

test("My Scenes tab is shown for authenticated users even when DISPLAY_AUTH_FLOWS is false", async () => {
  // Admin-created users who log in get the full experience despite the flag.
  await renderTestApp("/scenes/examples", { isAuthenticated: true });
  const tablist = await screen.findByRole("tablist", { name: "Scenes" });
  expect(within(tablist).getByRole("tab", { name: "My Scenes" })).toBeTruthy();
});

test("Navigating to /scenes/me redirects to /scenes/examples when DISPLAY_AUTH_FLOWS is false", async () => {
  const { location } = await renderTestApp("/scenes/me");
  const tablist = await screen.findByRole("tablist", { name: "Scenes" });
  await within(tablist).findByRole("tab", {
    selected: true,
    name: "Examples",
  });
  await waitFor(() => {
    expect(location.current.pathname).toBe("/scenes/examples");
  });
});
