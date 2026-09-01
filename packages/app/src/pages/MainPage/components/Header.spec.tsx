import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitForAppReady } from "@/test_util";

test.each([
  { authStatus: true, expected: { hasSigin: false, hasSigout: true } },
  { authStatus: false, expected: { hasSigin: true, hasSigout: false } },
])(
  "Header includes signin / signout links based on current auth status (authenticated=$authStatus)",
  async ({ authStatus, expected }) => {
    const { queryClient } = renderTestApp("", { isAuthenticated: authStatus });
    // Sign in/out visibility is gated on the ["me"] auth query resolving, and
    // the header has no positive anchor for the absent state (e.g. "Sign in"
    // is simply absent when authenticated). Wait for auth to settle so these
    // presence/absence assertions aren't false-greens.
    await waitForAppReady(queryClient);

    const signin = screen.queryByRole("button", { name: "Sign in" });

    const button = screen.getByRole("button", { name: "Open User Menu" });
    await user.click(button);
    await screen.findByRole("menu");

    const signout = screen.queryByRole("menuitem", { name: "Sign out" });

    expect(!!signin).toBe(expected.hasSigin);
    expect(!!signout).toBe(expected.hasSigout);
  },
);

test("Login button opens login overlay", async () => {
  const { location } = renderTestApp("", { isAuthenticated: false });
  const signin = await screen.findByRole("button", { name: "Sign in" });
  await user.click(signin);
  expect(location.current.search).toContain("overlay=login");
});

test("Contact links to the GitHub issues page in a new tab", async () => {
  renderTestApp("", { isAuthenticated: false });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const contact = await screen.findByRole("menuitem", { name: "Contact" });
  expect(contact).toHaveAttribute("href", import.meta.env.VITE_ISSUE_URL);
  expect(contact).toHaveAttribute("target", "_blank");
  expect(contact).toHaveAttribute("rel", "noreferrer");
});

test("Sign out opens logout overlay", async () => {
  const { location } = renderTestApp("", { isAuthenticated: true });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const signout = screen.getByRole("menuitem", { name: "Sign out" });
  await user.click(signout);
  expect(location.current.search).toContain("overlay=logout");
});

test("Account Settings opens settings overlay", async () => {
  const { location } = renderTestApp("", { isAuthenticated: true });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const settings = screen.getByRole("menuitem", { name: "Account Settings" });
  await user.click(settings);
  expect(location.current.search).toContain("overlay=settings");
});
