import { test, expect } from "vitest";
import { mockAuth } from "@math3d/mock-api";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";

test("Settings dialog opens via overlay param and closes by clearing it", async () => {
  const { location } = renderTestApp("/?overlay=settings", {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", {
    name: "Account Settings",
  });
  expect(dialog).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});

test("If not authenticated, redirects to the login overlay", async () => {
  const { location } = renderTestApp("/?overlay=settings", {
    isAuthenticated: false,
  });
  await waitFor(() =>
    expect(location.current.search).toContain("overlay=login"),
  );
  expect(screen.queryByRole("dialog", { name: "Account Settings" })).toBe(null);
});

test("session expiring mid-dialog redirects to the login overlay", async () => {
  const { location, queryClient } = renderTestApp("/?overlay=settings", {
    isAuthenticated: true,
  });
  await screen.findByRole("dialog", { name: "Account Settings" });
  // The session expires server-side — no deliberate action by the user.
  mockAuth.setCurrentUser(null);
  await queryClient.invalidateQueries({ queryKey: ["me"] });
  await waitFor(() =>
    expect(location.current.search).toContain("overlay=login"),
  );
});

test("deleting your own account does not redirect to login", async () => {
  const { location } = renderTestApp("/?overlay=settings", {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", {
    name: "Account Settings",
  });
  await user.click(within(dialog).getByRole("tab", { name: "Delete Account" }));
  await user.type(
    within(dialog).getByLabelText("Password"),
    "current-password",
  );
  await user.type(
    within(dialog).getByLabelText("Confirm"),
    "Yes, permanently delete",
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Delete Account" }),
  );
  // Deleting signs you out; the "Account Deleted" notice must show — not login.
  await screen.findByRole("heading", { name: "Account Deleted" });
  expect(location.current.search).not.toContain("overlay=login");
});
