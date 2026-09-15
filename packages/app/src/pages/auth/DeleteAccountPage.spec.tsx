import { test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { mockAuth } from "@math3d/mock-api";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";

test("If not authenticated, redirects to the login overlay", async () => {
  const { location } = renderTestApp("/?overlay=delete-account", {
    isAuthenticated: false,
  });
  await waitFor(() =>
    expect(location.current.search).toContain("overlay=login"),
  );
  expect(screen.queryByRole("dialog", { name: "Delete Account" })).toBe(null);
});

test("deleting your own account does not redirect to login", async () => {
  const { location } = renderTestApp("/?overlay=delete-account", {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", {
    name: "Delete Account",
  });
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

test("the wrong confirmation phrase does not delete the account", async () => {
  renderTestApp("/?overlay=delete-account", { isAuthenticated: true });
  const dialog = await screen.findByRole("dialog", {
    name: "Delete Account",
  });

  const confirm = within(dialog).getByLabelText("Confirm");
  await user.type(confirm, "yes delete it");
  await user.click(
    within(dialog).getByRole("button", { name: "Delete Account" }),
  );

  // Validation failing is the positive signal: the dialog staying mounted is
  // also what a still-in-flight deletion looks like.
  await waitFor(() => expect(confirm).toBeInvalid());
  expect(dialog).toBeInTheDocument();
});

test("a failed deletion surfaces the error instead of silently reopening", async () => {
  server.use(
    http.post("*/v1/auth/users/me/delete/", () =>
      HttpResponse.json({ detail: "boom" }, { status: 500 }),
    ),
  );
  renderTestApp("/?overlay=delete-account", { isAuthenticated: true });
  const dialog = await screen.findByRole("dialog", {
    name: "Delete Account",
  });

  await user.type(
    within(dialog).getByLabelText("Confirm"),
    "Yes, permanently delete",
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Delete Account" }),
  );

  // The confirmation phrase is the form's only field, so a server-side failure
  // has no field to attach to and is invisible unless the root error renders.
  expect(
    await within(dialog).findByText(/something went wrong/i),
  ).toBeVisible();
});

test("a 403 sends the user to sign in again instead of a generic failure", async () => {
  // Drop the session as well as answering 403: the refetch the 403 triggers is
  // what the redirect reads, and a session that is still good there would keep
  // the dialog where it is.
  server.use(
    http.post("*/v1/auth/users/me/delete/", () => {
      mockAuth.setCurrentUser(null);
      return HttpResponse.json({ detail: "Forbidden." }, { status: 403 });
    }),
  );
  const { location } = renderTestApp("/?overlay=delete-account", {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", {
    name: "Delete Account",
  });

  await user.type(
    within(dialog).getByLabelText("Confirm"),
    "Yes, permanently delete",
  );
  await user.click(
    within(dialog).getByRole("button", { name: "Delete Account" }),
  );

  await screen.findByRole("heading", { name: "Could not delete your account" });
  await waitFor(() =>
    expect(location.current.search).toContain("overlay=login"),
  );
});
