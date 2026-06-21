import { test, expect } from "vitest";
import { renderTestApp, screen, user } from "@/test_util";

vi.mock("@/features/auth/displayAuthFlows", () => ({
  DISPLAY_AUTH_FLOWS: false,
}));

test("Sign in and Sign up header buttons are hidden when DISPLAY_AUTH_FLOWS is false", async () => {
  await renderTestApp("", { isAuthenticated: false });
  await screen.findByRole("button", { name: "Open User Menu" });

  expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Sign up" })).toBeNull();
});

test("Sign in and Sign up menu items are hidden when DISPLAY_AUTH_FLOWS is false", async () => {
  await renderTestApp("", { isAuthenticated: false });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  await screen.findByRole("menu");

  expect(screen.queryByRole("menuitem", { name: "Sign in" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Sign up" })).toBeNull();
});

test("Logged-in users still get account menu items when DISPLAY_AUTH_FLOWS is false", async () => {
  // Admin-created users who reach the login page directly should get the full
  // authenticated experience even though auth UI is hidden by the flag.
  await renderTestApp("", { isAuthenticated: true });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  await screen.findByRole("menu");

  expect(
    screen.getByRole("menuitem", { name: "Account Settings" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("menuitem", { name: "Sign out" }),
  ).toBeInTheDocument();
});
