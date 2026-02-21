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
