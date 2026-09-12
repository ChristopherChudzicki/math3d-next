import { test, expect, afterEach, vi } from "vitest";
import * as Sentry from "@sentry/react";
import {
  renderTestApp,
  screen,
  user,
  waitFor,
  act,
  mockGoogleIdentity,
} from "@/test_util";
import { seedDb } from "@math3d/mock-api";

vi.mock("@sentry/react", () => ({ captureException: vi.fn() }));

afterEach(() => {
  // A stub left installed makes the next test's loader short-circuit onto it,
  // so every test here would depend on the ones before it.
  delete window.google;
  // Without a stub the loader injects its script into document.head, outside
  // any container a testing-library query can reach.
  // eslint-disable-next-line testing-library/no-node-access
  document
    .querySelectorAll('script[src^="https://accounts.google.com"]')
    .forEach((el) => el.remove());
});

test("A Google credential signs the user in and closes the overlay", async () => {
  const userData = seedDb.withUser();
  const gsi = mockGoogleIdentity();
  const { location } = renderTestApp("/?overlay=login");

  await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());
  await act(async () => {
    gsi.fireCredential(
      JSON.stringify({ id: userData.uid, email: userData.email }),
    );
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

test("A rejected sign-in shows one message and reports to Sentry", async () => {
  // An id_token the mock cannot parse is allauth's own `invalid_token` 400.
  // Every other rejection — sign-ups closed, an address held by an unlinked
  // account, a CSRF 403 — shares this branch; Sentry is what tells them apart.
  const gsi = mockGoogleIdentity();
  renderTestApp("/?overlay=login");

  await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());
  await act(async () => {
    gsi.fireCredential("not-a-credential");
  });

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /could not complete the sign-in/i,
  );
  expect(screen.getByRole("link", { name: "get in touch" })).toHaveAttribute(
    "href",
    import.meta.env.VITE_ISSUE_URL,
  );
  expect(Sentry.captureException).toHaveBeenCalled();
});

test("Says so when Google's script never loads", async () => {
  renderTestApp("/?overlay=login");
  await screen.findByRole("dialog", { name: "Sign in" });

  const script = await waitFor(() => {
    // The gsi/client script is injected into document.head, outside any
    // container a testing-library query can reach.
    // eslint-disable-next-line testing-library/no-node-access
    const el = document.querySelector(
      'script[src^="https://accounts.google.com"]',
    );
    if (!el) throw new Error("The gsi/client script was not injected.");
    return el;
  });
  await act(async () => {
    script.dispatchEvent(new Event("error"));
  });

  expect(await screen.findByRole("alert")).toHaveTextContent(
    /Could not load Google sign-in/i,
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

test("signing in leaves unsaved edits to the open scene intact", async () => {
  const userData = seedDb.withUser();
  const scene = seedDb.withSceneFromItems([]);
  const gsi = mockGoogleIdentity();
  renderTestApp(`/${scene.key}`);

  const title = await screen.findByLabelText<HTMLInputElement>("Scene Title");
  await user.type(title, " (unsaved edit)");
  const edited = title.value;

  await user.click(
    await screen.findByRole("button", { name: "Sign in", hidden: true }),
  );
  await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() => expect(gsi.initialize).toHaveBeenCalled());
  await act(async () => {
    gsi.fireCredential(
      JSON.stringify({ id: userData.uid, email: userData.email }),
    );
  });

  await user.click(screen.getByRole("button", { name: "Open User Menu" }));
  expect(await screen.findByTestId("username-display")).toHaveTextContent(
    userData.email,
  );
  expect(title).toHaveValue(edited);
});

test("the dev sign-in control signs in as the address it is given", async () => {
  renderTestApp("/?overlay=login");

  const email = await screen.findByLabelText("Dev sign-in email");
  await user.clear(email);
  await user.type(email, "someone@example.com");
  await user.click(screen.getByRole("button", { name: "Sign in as dev user" }));

  await user.click(
    await screen.findByRole("button", { name: "Open User Menu" }),
  );
  expect(await screen.findByTestId("username-display")).toHaveTextContent(
    "someone@example.com",
  );
});
