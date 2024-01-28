import { test, expect } from "vitest";
import { renderTestApp, screen, user } from "@/test_util";

test.each([
  { authStatus: true, expected: { hasSigin: false, hasSigout: true } },
  { authStatus: false, expected: { hasSigin: true, hasSigout: false } },
])(
  "Header includes signin / signout links based on current auth status (authenticated=$authStatus)",
  async ({ authStatus, expected }) => {
    await renderTestApp("", { isAuthenticated: authStatus });
    await screen.findByRole("button", { name: "Open User Menu" });

    const signin = screen.queryByRole("link", { name: "Sign in" });

    const button = screen.getByRole("button", { name: "Open User Menu" });
    await user.click(button);
    await screen.findByRole("menu");

    const signout = screen.queryByRole("menuitem", { name: "Sign out" });

    expect(!!signin).toBe(expected.hasSigin);
    expect(!!signout).toBe(expected.hasSigout);
  },
);

test("Login link goes to login page", async () => {
  const { location } = await renderTestApp("", { isAuthenticated: false });
  const signin = screen.getByRole("link", { name: "Sign in" });
  await user.click(signin);
  expect(location.current.pathname).toBe(`/auth/login`);
});

test("Logout link goes to login page", async () => {
  const { location } = await renderTestApp("", { isAuthenticated: true });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const signin = screen.getByRole("menuitem", { name: "Sign out" });
  await user.click(signin);
  expect(location.current.pathname).toBe(`/auth/logout`);
});
