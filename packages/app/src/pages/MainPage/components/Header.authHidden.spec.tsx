import { test, expect } from "vitest";
import { renderTestApp, screen, user } from "@/test_util";

vi.mock("@/features/auth/displayAuthFlows", () => ({
  DISPLAY_AUTH_FLOWS: false,
}));

test("Sign in and Sign up header buttons are hidden when DISPLAY_AUTH_FLOWS is false", async () => {
  renderTestApp("", { isAuthenticated: false });
  await screen.findByRole("button", { name: "Open Menu" });

  expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Sign up" })).toBeNull();
});

test("Sign in and Sign up menu items are hidden when DISPLAY_AUTH_FLOWS is false", async () => {
  renderTestApp("", { isAuthenticated: false });
  const button = await screen.findByRole("button", { name: "Open Menu" });
  await user.click(button);
  await screen.findByRole("menu");

  expect(screen.queryByRole("menuitem", { name: "Sign in" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Sign up" })).toBeNull();
});

test("Logged-in users still get account menu items when DISPLAY_AUTH_FLOWS is false", async () => {
  // Admin-created users who reach the login page directly should get the full
  // authenticated experience even though auth UI is hidden by the flag.
  renderTestApp("", { isAuthenticated: true });
  // The trigger swaps from a hamburger ("Open Menu") to the user avatar
  // ("Open User Menu") once the ["me"] query resolves. Anchoring on the
  // avatar's name waits past the transient hamburger to the stable node.
  const button = await screen.findByRole("button", { name: "Open User Menu" });
  await user.click(button);
  await screen.findByRole("menu");

  expect(
    screen.getByRole("menuitem", { name: "Account Settings" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("menuitem", { name: "Sign out" }),
  ).toBeInTheDocument();
});
