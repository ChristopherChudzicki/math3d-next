import { test, expect } from "vitest";
import { renderTestApp, screen, within } from "@/test_util";

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

test("the soft-404 links back to the editor", async () => {
  renderTestApp("/app/does-not-exist");
  const main = await screen.findByRole("main");
  expect(
    within(main).getByRole("link", { name: "Back to Math3d" }),
  ).toHaveAttribute("href", "/");
});

test("the header's wordmark links home for the mouse only", async () => {
  renderTestApp("/app/does-not-exist");
  const banner = await screen.findByRole("banner");
  expect(
    within(banner)
      .getAllByRole("link")
      .map((link) => link.textContent),
  ).toEqual(["Back to Math3d"]);
  const wordmark = within(banner).getByText("Math3d").closest("a");
  expect(wordmark).toHaveAttribute("href", "/");
  expect(wordmark).toHaveAttribute("tabindex", "-1");
});
