import { test, expect, vi } from "vitest";
import { renderTestApp, screen } from "@/test_util";
import { seedDb } from "@math3d/mock-api";

// Force the "loading" auth state to pin LogoutPage's guard: it must NOT
// redirect away while auth status is still loading (only once it resolves
// to "unauthenticated").
vi.mock("@/features/auth/useAuthStatus", () => ({
  useAuthStatus: () => "loading",
}));

test("Does not redirect while auth status is loading", () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(`/${scene.key}?overlay=logout`, {
    isAuthenticated: true,
  });

  expect(screen.getByRole("dialog", { name: "Sign out" })).toBeInTheDocument();
  expect(location.current.search).toContain("overlay=logout");
});
