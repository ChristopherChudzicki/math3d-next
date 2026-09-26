import { afterEach, beforeEach, expect, test } from "vitest";
import { delay, http } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import { act, renderTestApp, screen, user, waitFor } from "@/test_util";
import { getStore } from "@/store/store";
import {
  SIGN_IN_DRAFT_KEY,
  saveSignInDraft,
} from "@/features/auth/signInDraft";

// jsdom can't navigate; stop the native submission after React's handler ran.
const stopNavigation = (event: Event) => event.preventDefault();
beforeEach(() => document.addEventListener("submit", stopNavigation));
afterEach(() => {
  document.removeEventListener("submit", stopNavigation);
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

test("Google sign-in posts allauth's redirect form, returning to this page", async () => {
  renderTestApp("/?controls=0&overlay=login#h");

  const form = await screen.findByRole("form", { name: "Sign in with Google" });

  expect(form).toHaveAttribute("method", "post");
  expect(form).toHaveAttribute(
    "action",
    `${import.meta.env.VITE_API_BASE_URL}/_allauth/browser/v1/auth/provider/redirect`,
  );
  expect(form).toHaveFormValues({
    provider: "google",
    process: "login",
    callback_url: `${window.location.origin}/?controls=0#h`,
  });
});

test("Submitting saves a draft and sends the CSRF token", async () => {
  document.cookie = "csrftoken=token-from-cookie";
  renderTestApp("/?overlay=login");

  const button = await screen.findByRole("button", {
    name: "Sign in with Google",
  });
  await waitFor(() => expect(button).toBeEnabled());
  await user.click(button);

  expect(
    screen.getByRole("form", { name: "Sign in with Google" }),
  ).toHaveFormValues({ csrfmiddlewaretoken: "token-from-cookie" });
  expect(
    JSON.parse(sessionStorage.getItem(SIGN_IN_DRAFT_KEY) ?? "{}").pathname,
  ).toBe("/");
});

test("Sign-in waits for the session check that seeds the CSRF cookie", async () => {
  server.use(http.get(urls.auth.usersMe, () => delay("infinite")));
  renderTestApp("/?overlay=login");

  expect(
    await screen.findByRole("button", { name: "Sign in with Google" }),
  ).toBeDisabled();
});

test("A returned error opens the dialog with fixed text and leaves the URL clean", async () => {
  const { location } = renderTestApp(
    "/?error=signup_closed&error_process=login",
  );

  const dialog = await screen.findByRole("dialog", { name: "Sign in" });
  expect(dialog).toHaveTextContent(/sign-ups are closed/i);
  expect(location.current.search).toBe("?overlay=login");
});

test("An unrecognized error is never echoed", async () => {
  renderTestApp("/?error=%3Cb%3Eowned%3C%2Fb%3E&error_process=login");

  const dialog = await screen.findByRole("dialog", { name: "Sign in" });
  expect(dialog).not.toHaveTextContent("owned");
  expect(screen.getByRole("link", { name: "get in touch" })).toHaveAttribute(
    "href",
    import.meta.env.VITE_ISSUE_URL,
  );
});

test("The sign-in error page returns to the draft's page with its error", async () => {
  const scene = seedDb.withSceneFromItems([]);
  saveSignInDraft(getStore().getState(), `/${scene.key}`);

  const { location } = renderTestApp(
    "/app/sign-in-error?error=signup_closed&error_process=login",
  );

  const dialog = await screen.findByRole("dialog", { name: "Sign in" });
  expect(dialog).toHaveTextContent(/sign-ups are closed/i);
  expect(location.current.pathname).toBe(`/${scene.key}`);
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
