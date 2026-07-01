import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";
import { seedDb } from "@math3d/mock-api";

test("Sign out closes the overlay and signs the user out", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(`/${scene.key}?overlay=logout`, {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", { name: "Sign out" });
  await user.click(
    within(dialog).getByRole("button", { name: "Yes, sign out" }),
  );
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});

test("Cancel closes the overlay without signing the user out", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(`/${scene.key}?overlay=logout`, {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", { name: "Sign out" });
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});

test("If not authenticated, closes the overlay", async () => {
  const { location } = await renderTestApp("/?overlay=logout", {
    isAuthenticated: false,
  });
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});
