import { test, expect, onTestFinished } from "vitest";
import { server } from "@math3d/mock-api/node";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";
import { seedDb } from "@math3d/mock-api";

const countLogouts = () => {
  const seen = { count: 0 };
  const listener = ({ request }: { request: Request }) => {
    if (
      request.method === "DELETE" &&
      new URL(request.url).pathname.endsWith("/auth/session")
    ) {
      seen.count += 1;
    }
  };
  server.events.on("request:start", listener);
  onTestFinished(() => {
    server.events.removeListener("request:start", listener);
  });
  return seen;
};

test("Sign out closes the overlay and signs the user out", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const logouts = countLogouts();
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
  const logouts = countLogouts();
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
