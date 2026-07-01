import { test, expect } from "vitest";
import { renderTestApp, screen, user, within, waitFor } from "@/test_util";

test("unmatched /app path renders soft-404", async () => {
  await renderTestApp("/app/does-not-exist");
  expect(
    await screen.findByRole("heading", { name: /not found/i }),
  ).toBeVisible();
});

test("bare /app renders soft-404", async () => {
  await renderTestApp("/app");
  expect(
    await screen.findByRole("heading", { name: /not found/i }),
  ).toBeVisible();
});

test("unmatched non-app multi-segment path renders soft-404, not a crash", async () => {
  // R1: a reserved-web-infra-shaped path that reaches the router must NOT hit React
  // Router's default error boundary. Requires the ROOT-level "*" catch-all below.
  await renderTestApp("/.well-known/foo");
  expect(
    await screen.findByRole("heading", { name: /not found/i }),
  ).toBeVisible();
});

test("a non-existent scene key still notifies and redirects to /", async () => {
  // Missing-scene behavior is unchanged (handled in SceneControls), NOT the soft-404 page.
  // The notification is a plain MUI <Dialog> (role "dialog", not "alertdialog") with an "OK"
  // button (NotificationsDisplay renders "OK" for type:"alert"; SceneControls uses type:"alert").
  const { location } = await renderTestApp("/definitelynotascene");
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "OK" }));
  await waitFor(() => expect(location.current.pathname).toBe("/"));
});
