import { test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import {
  countRequests,
  renderTestApp,
  screen,
  user,
  waitFor,
  within,
} from "@/test_util";
import { seedDb, urls } from "@math3d/mock-api";

test("Sign out closes the overlay and signs the user out", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const logouts = countRequests("DELETE", "/auth/session");
  const { location } = renderTestApp(`/${scene.key}?overlay=logout`, {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("alertdialog", { name: "Sign out" });
  await user.click(
    within(dialog).getByRole("button", { name: "Yes, sign out" }),
  );
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
  expect(logouts.count).toBe(1);
});

test("Cancel closes the overlay without signing the user out", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const logouts = countRequests("DELETE", "/auth/session");
  const { location } = renderTestApp(`/${scene.key}?overlay=logout`, {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("alertdialog", { name: "Sign out" });
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
  expect(logouts.count).toBe(0);
});

test("If not authenticated, closes the overlay", async () => {
  const { location } = renderTestApp("/?overlay=logout", {
    isAuthenticated: false,
  });
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});

test("a failed sign-out says so in the dialog, which stays open", async () => {
  server.use(
    http.delete(urls.auth.session, () =>
      HttpResponse.json({}, { status: 500 }),
    ),
  );
  renderTestApp("/?overlay=logout", { isAuthenticated: true });
  const dialog = await screen.findByRole("alertdialog", { name: "Sign out" });

  await user.click(
    within(dialog).getByRole("button", { name: "Yes, sign out" }),
  );

  expect(await within(dialog).findByRole("alert")).toHaveTextContent(
    "Couldn’t sign out. Try again.",
  );
  expect(dialog).toBeInTheDocument();
});
