import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitForAppReady } from "@/test_util";

vi.mock("@/features/auth/displayAuthFlows", () => ({
  DISPLAY_AUTH_FLOWS: false,
}));

test("Sign in header button is hidden when DISPLAY_AUTH_FLOWS is false", async () => {
  renderTestApp("", { isAuthenticated: false });
  await screen.findByRole("button", { name: "Open Menu" });

  expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
});

test("Sign in menu item is hidden when DISPLAY_AUTH_FLOWS is false", async () => {
  const { queryClient } = renderTestApp("", { isAuthenticated: false });
  // While auth is pending the menu never offers Sign in, so wait it out or the
  // absence below holds whatever the flag says.
  await waitForAppReady(queryClient);
  const button = await screen.findByRole("button", { name: "Open Menu" });
  await user.click(button);
  await screen.findByRole("menu");

  expect(screen.queryByRole("menuitem", { name: "Sign in" })).toBeNull();
});

test("Logged-in users still get account menu items when DISPLAY_AUTH_FLOWS is false", async () => {
  // The flag is presentation-only: it hides the sign-in affordances, so a
  // session that already exists still gets the authenticated view.
  renderTestApp("", { isAuthenticated: true });
  // The trigger swaps from a hamburger ("Open Menu") to the user avatar
  // ("Open User Menu") once the ["me"] query resolves. Anchoring on the
  // avatar's name waits past the transient hamburger to the stable node.
  const button = await screen.findByRole("button", { name: "Open User Menu" });
  await user.click(button);
  await screen.findByRole("menu");

  expect(
    screen.getByRole("menuitem", { name: "Delete Account" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("menuitem", { name: "Sign out" }),
  ).toBeInTheDocument();
});
