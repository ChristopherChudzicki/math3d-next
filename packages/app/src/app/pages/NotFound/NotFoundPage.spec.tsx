import { test, expect } from "vitest";
import { renderTestApp, screen } from "@/test_util";

test("unmatched /app path renders soft-404", async () => {
  renderTestApp("/app/does-not-exist");
  expect(
    await screen.findByRole("heading", { name: /not found/i }),
  ).toBeVisible();
});

test("bare /app renders soft-404", async () => {
  renderTestApp("/app");
  expect(
    await screen.findByRole("heading", { name: /not found/i }),
  ).toBeVisible();
});

test("unmatched non-app multi-segment path renders soft-404, not a crash", async () => {
  // R1: a reserved-web-infra-shaped path that reaches the router must NOT hit React
  // Router's default error boundary. Requires the ROOT-level "*" catch-all below.
  renderTestApp("/.well-known/foo");
  expect(
    await screen.findByRole("heading", { name: /not found/i }),
  ).toBeVisible();
});

test("a non-existent scene key shows the editor's not-found card, not the soft-404", async () => {
  // A missing scene is the editor's to explain (useSceneLoader), not the router's.
  renderTestApp("/definitelynotascene");
  expect(
    await screen.findByRole("heading", { name: "This scene doesn’t exist." }),
  ).toBeVisible();
  expect(screen.queryByRole("heading", { name: /page not found/i })).toBeNull();
});
