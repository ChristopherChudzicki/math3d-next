import { test, expect } from "vitest";
import {
  renderTestApp,
  screen,
  user,
  waitFor,
  act,
  mockGoogleIdentity,
} from "@/test_util";
import { seedDb } from "@math3d/mock-api";

test("A Google credential signs the user in and closes the overlay", async () => {
  const userData = seedDb.withUser();
  const gsi = mockGoogleIdentity();
  const { location } = renderTestApp("/?overlay=login");

  await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());
  await act(async () => {
    gsi.fireCredential(JSON.stringify({ email: userData.email }));
  });

  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  // The overlay closes on its own once the session exists. The avatar trigger
  // is no proof of that — it is also what a signed-out visitor sees while
  // DISPLAY_AUTH_FLOWS is true — so read the email the menu shows only for an
  // authenticated user.
  await user.click(screen.getByRole("button", { name: "Open User Menu" }));
  expect(await screen.findByTestId("username-display")).toHaveTextContent(
    userData.email,
  );
});

test("If authenticated already, closes the overlay", async () => {
  const { location } = renderTestApp("/?overlay=login", {
    isAuthenticated: true,
  });
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});

test("open pushes one history entry; Back returns to the underlying view", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location, router } = renderTestApp(`/${scene.key}`);
  // open login from the header trigger
  await user.click(
    await screen.findByRole("button", { name: "Sign in", hidden: true }),
  );
  await screen.findByRole("dialog", { name: "Sign in" });
  expect(location.current.search).toContain("overlay=login");
  await act(() => router.navigate(-1));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});

test("opening/closing an overlay preserves other params and the hash", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(`/${scene.key}?controls=0#frag`);
  await user.click(
    await screen.findByRole("button", { name: "Sign in", hidden: true }),
  );
  await screen.findByRole("dialog", { name: "Sign in" });
  expect(location.current.search).toContain("controls=0");
  expect(location.current.hash).toBe("#frag");
  await user.click(screen.getByRole("button", { name: "Close" })); // BasicDialog close
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.search).toContain("controls=0"); // merged, not clobbered
  expect(location.current.hash).toBe("#frag");
});
