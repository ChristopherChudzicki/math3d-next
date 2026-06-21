import { test, expect, vi } from "vitest";
import { renderTestApp, screen } from "@/test_util";

// Force the "loading" auth state to pin LogoutPage's guard: it must NOT
// redirect away while auth status is still loading (only once it resolves
// to "unauthenticated").
vi.mock("@/features/auth/useAuthStatus", () => ({
  useAuthStatus: () => "loading",
}));

test("Does not redirect while auth status is loading", async () => {
  const { location } = await renderTestApp("/auth/logout", {
    isAuthenticated: true,
  });

  expect(screen.getByRole("dialog", { name: "Sign out" })).toBeInTheDocument();
  expect(location.current.pathname).toBe("/auth/logout");
});
