import { test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { renderTestApp, screen, user } from "@/test_util";

test.each([
  { authStatus: true, expected: { hasSigin: false, hasSigout: true } },
  { authStatus: false, expected: { hasSigin: true, hasSigout: false } },
])(
  "Header includes signin / signout links based on current auth status (authenticated=$authStatus)",
  async ({ authStatus, expected }) => {
    await renderTestApp("", { isAuthenticated: authStatus });
    await screen.findByRole("button", { name: "Open User Menu" });

    const signin = screen.queryByRole("button", { name: "Sign in" });

    const button = screen.getByRole("button", { name: "Open User Menu" });
    await user.click(button);
    await screen.findByRole("menu");

    const signout = screen.queryByRole("menuitem", { name: "Sign out" });

    expect(!!signin).toBe(expected.hasSigin);
    expect(!!signout).toBe(expected.hasSigout);
  },
);

test("treats an empty-bodied 403 from /me as unauthenticated, not 'loading'", async () => {
  // The real backend returns 401/403 with no body, so openapi-fetch leaves
  // `error` undefined. useUserMe must still resolve to null (unauthenticated)
  // by keying on HTTP status — otherwise useAuthStatus reads `undefined` as
  // "loading" and the sign-in UI never renders. (The default mock returns a
  // body, which is why this gap only showed up against the real backend.)
  server.use(
    http.get(
      "*/v1/auth/users/me/",
      () => new HttpResponse(null, { status: 403 }),
    ),
  );

  await renderTestApp("", { isAuthenticated: false });

  expect(
    await screen.findByRole("button", { name: "Sign in" }),
  ).toBeInTheDocument();
});

test("Login button opens login overlay", async () => {
  const { location } = await renderTestApp("", { isAuthenticated: false });
  const signin = screen.getByRole("button", { name: "Sign in" });
  await user.click(signin);
  expect(location.current.search).toContain("overlay=login");
});

test("Contact links to the GitHub issues page in a new tab", async () => {
  await renderTestApp("", { isAuthenticated: false });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const contact = await screen.findByRole("menuitem", { name: "Contact" });
  expect(contact).toHaveAttribute("href", import.meta.env.VITE_ISSUE_URL);
  expect(contact).toHaveAttribute("target", "_blank");
  expect(contact).toHaveAttribute("rel", "noreferrer");
});

test("Logout link goes to login page", async () => {
  const { location } = await renderTestApp("", { isAuthenticated: true });
  const button = screen.getByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const signin = screen.getByRole("menuitem", { name: "Sign out" });
  await user.click(signin);
  expect(location.current.pathname).toBe(`/auth/logout`);
});
