import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";

const querySignInLink = () => {
  const nav = screen.getByRole("navigation", { hidden: true });
  const signin = within(nav).queryByRole("link", {
    name: "Sign in",
    hidden: true,
  });
  return signin;
};

test("Logout dialog logs user out", async () => {
  const { location } = await renderTestApp("/auth/logout", {
    isAuthenticated: true,
  });
  expect(querySignInLink()).toBe(null);

  const dialog = screen.getByRole("dialog");
  const logout = within(dialog).getByRole("button", { name: "Yes, log out" });

  await user.click(logout);

  expect(querySignInLink()).toBeInTheDocument();

  // Re-routed and dialog closed
  expect(location.current.pathname).toBe("/");
  expect(dialog).not.toBeInTheDocument();
});

test("Does not log user out if dialog is cancelled", async () => {
  const { location } = await renderTestApp("/auth/logout", {
    isAuthenticated: true,
  });
  expect(querySignInLink()).toBe(null);

  const dialog = screen.getByRole("dialog");
  const cancel = within(dialog).getByRole("button", { name: "Cancel" });

  await user.click(cancel);

  expect(querySignInLink()).toBe(null);

  // Re-routed and dialog closed
  expect(location.current.pathname).toBe("/");
  expect(dialog).not.toBeInTheDocument();
});

test("If not authenticated already, redirects to main", async () => {
  const { location } = await renderTestApp("/auth/logout", {
    isAuthenticated: false,
  });

  await waitFor(() => {
    expect(location.current.pathname).toBe("/");
  });
});
