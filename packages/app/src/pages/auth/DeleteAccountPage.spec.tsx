import { test, expect, vi } from "vitest";
import * as Sentry from "@sentry/react";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { mockAuth } from "@math3d/mock-api";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureException: vi.fn(),
}));

test("If not authenticated, switches to the sign-in dialog", async () => {
  const { location } = renderTestApp("/?overlay=delete-account");
  // Not stacked: whoever signs in might be a different account.
  await waitFor(() => expect(location.current.search).toBe("?signin="));
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
  expect(location.current.search).not.toContain("signin");
});

test("opens on the confirmation field", async () => {
  renderTestApp("/?overlay=delete-account", { isAuthenticated: true });
  const dialog = await screen.findByRole("dialog", {
    name: "Delete Account",
  });

  await waitFor(() =>
    expect(within(dialog).getByLabelText("Confirm")).toHaveFocus(),
  );
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
    http.delete("*/v1/auth/users/me/", () =>
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
  expect(Sentry.captureException).toHaveBeenCalledWith(
    expect.objectContaining({ status: 500 }),
  );
});

test("a 403 sends the user to sign in again instead of a generic failure", async () => {
  // Drop the session as well as answering 403: the refetch the 403 triggers is
  // what the redirect reads, and a session that is still good there would keep
  // the dialog where it is.
  server.use(
    http.delete("*/v1/auth/users/me/", () => {
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

  // The notice comes first; a sign-in dialog opened over it would hide it.
  const notice = await screen.findByRole("alertdialog", {
    name: "Could not delete your account",
  });
  expect(location.current.search).not.toContain("signin");

  await user.click(within(notice).getByRole("button", { name: "OK" }));
  await waitFor(() => expect(location.current.search).toBe("?signin="));
});

test("a 403 with the session intact keeps the dialog beneath the notice", async () => {
  // A CSRF token that didn't check out: the session is still good, so there
  // is no sign-in to switch to, and the user can try again.
  server.use(
    http.delete("*/v1/auth/users/me/", () =>
      HttpResponse.json({ detail: "Forbidden." }, { status: 403 }),
    ),
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

  const notice = await screen.findByRole("alertdialog", {
    name: "Could not delete your account",
  });
  // Clicking in the notice is outside the dialog beneath; it mustn't close it.
  await user.click(within(notice).getByRole("button", { name: "OK" }));

  await waitFor(() => expect(notice).not.toBeInTheDocument());
  // The same dialog, never remounted: the typed phrase is still there.
  expect(dialog).toBeInTheDocument();
  expect(within(dialog).getByLabelText("Confirm")).toHaveValue(
    "Yes, permanently delete",
  );
  expect(location.current.search).toBe("?overlay=delete-account");
});

test("while the delete is in flight, the dialog can't be closed", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.delete("*/v1/auth/users/me/", async () => {
      await gate;
      return HttpResponse.json({ detail: "late" }, { status: 500 });
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
  const submit = within(dialog).getByRole("button", {
    name: "Delete Account",
  });
  await user.click(submit);

  await waitFor(() => expect(submit).toHaveAttribute("aria-disabled", "true"));
  expect(within(dialog).getByRole("button", { name: "Close" })).toBeDisabled();
  expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
  await user.keyboard("{Escape}");
  expect(dialog).toBeInTheDocument();
  expect(location.current.search).toBe("?overlay=delete-account");

  release();
  await waitFor(() => expect(submit).not.toHaveAttribute("aria-disabled"));
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});

test("My Scenes in the warning opens the user's scene list", async () => {
  const { location } = renderTestApp("/?overlay=delete-account", {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", {
    name: "Delete Account",
  });

  await user.click(within(dialog).getByRole("button", { name: "My Scenes" }));

  expect(location.current.search).toBe("?overlay=scenes&list=me");
});
