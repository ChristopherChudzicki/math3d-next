import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { delay, http } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import { act, renderTestApp, screen, user, waitFor, within } from "@/test_util";
import { getStore } from "@/store/store";
import {
  SIGN_IN_DRAFT_KEY,
  saveSignInDraft,
} from "@/features/auth/signInDraft";
import { replaceLocation } from "@/util/replaceLocation";

vi.mock("@/util/replaceLocation");

// jsdom can't navigate; stop the native submission after React's handler ran.
const stopNavigation = (event: Event) => event.preventDefault();
beforeEach(() => document.addEventListener("submit", stopNavigation));
afterEach(() => {
  document.removeEventListener("submit", stopNavigation);
  document.cookie = "csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

test("Google sign-in posts allauth's redirect form, returning to this page and its overlay", async () => {
  renderTestApp("/?controls=0&overlay=scenes&list=me&signin#h");

  const button = await screen.findByRole("button", {
    name: "Sign in with Google",
  });
  const form = button.closest("form");

  expect(form).toHaveAttribute("method", "post");
  expect(form).toHaveAttribute(
    "action",
    `${import.meta.env.VITE_API_BASE_URL}/_allauth/browser/v1/auth/provider/redirect`,
  );
  expect(form).toHaveFormValues({
    provider: "google",
    process: "login",
    callback_url: `${window.location.origin}/?controls=0&overlay=scenes&list=me#h`,
  });
});

test("Submitting saves a draft and sends the CSRF token current at submit", async () => {
  document.cookie = "csrftoken=token-at-render";
  renderTestApp("/?signin");

  const button = await screen.findByRole("button", {
    name: "Sign in with Google",
  });
  await waitFor(() => expect(button).toBeEnabled());
  // Django rotates the token on any sign-in, such as one in another tab.
  document.cookie = "csrftoken=token-at-submit";
  await user.click(button);

  expect(button.closest("form")).toHaveFormValues({
    csrfmiddlewaretoken: "token-at-submit",
  });
  expect(
    JSON.parse(sessionStorage.getItem(SIGN_IN_DRAFT_KEY) ?? "{}").url,
  ).toBe(`${window.location.origin}/`);
});

test("Sign-in waits for the session check that seeds the CSRF cookie", async () => {
  server.use(http.get(urls.auth.usersMe, () => delay("infinite")));
  renderTestApp("/?signin");

  expect(
    await screen.findByRole("button", { name: "Sign in with Google" }),
  ).toBeDisabled();
});

test("A returned error opens the dialog over the page it left, with fixed text", async () => {
  const { location } = renderTestApp(
    "/?overlay=scenes&list=me&error=signup_closed&error_process=login",
  );

  const dialog = await screen.findByRole("dialog", { name: "Sign in" });
  expect(within(dialog).getByRole("alert")).toHaveTextContent(
    /sign-ups are closed/i,
  );
  expect(location.current.search).toBe("?overlay=scenes&list=me&signin=");
});

test("A cancelled sign-in is reported as information, not an error", async () => {
  renderTestApp("/?error=cancelled&error_process=login");

  const dialog = await screen.findByRole("dialog", { name: "Sign in" });
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    "Sign-in was cancelled.",
  );
  expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
});

test("A returned error opens no dialog for someone already signed in", async () => {
  const { location } = renderTestApp("/?error=unknown&error_process=login", {
    isAuthenticated: true,
  });

  await expect(
    screen.findByRole("dialog", { name: "Sign in" }, { timeout: 500 }),
  ).rejects.toThrow();
  expect(location.current.search).toBe("");
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

test("The sign-in error page loads the draft's page, query kept, with its error", async () => {
  saveSignInDraft(
    getStore().getState(),
    `${window.location.origin}/abc?controls=0`,
  );

  renderTestApp("/app/sign-in-error?error=signup_closed&error_process=login");

  // A full load, so the draft restores the way any return from sign-in does.
  await waitFor(() =>
    expect(replaceLocation).toHaveBeenCalledWith(
      `${window.location.origin}/abc?controls=0&error=signup_closed&error_process=login`,
    ),
  );
});

test("The sign-in error page returns home when no draft names a page", async () => {
  renderTestApp("/app/sign-in-error?error=signup_closed&error_process=login");

  await waitFor(() =>
    expect(replaceLocation).toHaveBeenCalledWith(
      `${window.location.origin}/?error=signup_closed&error_process=login`,
    ),
  );
});

test("If authenticated already, closes the dialog", async () => {
  const { location } = renderTestApp("/?signin", {
    isAuthenticated: true,
  });
  await waitFor(() => expect(location.current.search).toBe(""));
});

test("Back from the sign-in dialog returns to the overlay beneath it", async () => {
  const { location, router } = renderTestApp("/?overlay=scenes&list=me");
  await user.click(await screen.findByRole("button", { name: "sign in" }));
  await screen.findByRole("dialog", { name: "Sign in" });
  expect(location.current.search).toBe("?overlay=scenes&list=me&signin=");

  await act(() => router.navigate(-1));

  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Sign in" })).toBeNull(),
  );
  expect(location.current.search).toBe("?overlay=scenes&list=me");
  // My Scenes' prompt, reachable again now nothing covers it.
  expect(screen.getByRole("button", { name: "sign in" })).toBeVisible();
});

test("Closing a returned error's dialog keeps the overlay and forgets the error", async () => {
  const { location } = renderTestApp(
    "/?overlay=scenes&list=me&error=signup_closed&error_process=login#h",
  );
  const dialog = await screen.findByRole("dialog", { name: "Sign in" });

  await user.click(within(dialog).getByRole("button", { name: "Close" }));

  await waitFor(() =>
    expect(location.current.search).toBe("?overlay=scenes&list=me"),
  );
  expect(location.current.hash).toBe("#h");
  await user.click(screen.getByRole("button", { name: "sign in" }));
  expect(
    await screen.findByRole("dialog", { name: "Sign in" }),
  ).not.toHaveTextContent(/sign-ups are closed/i);
});

test("opening/closing the dialog preserves other params and the hash", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(`/${scene.key}?controls=0#frag`);
  await user.click(
    await screen.findByRole("button", { name: "Sign in", hidden: true }),
  );
  await screen.findByRole("dialog", { name: "Sign in" });
  expect(location.current.search).toContain("controls=0");
  expect(location.current.hash).toBe("#frag");
  await user.click(screen.getByRole("button", { name: "Close" })); // BasicDialog close
  await waitFor(() => expect(location.current.search).not.toContain("signin"));
  expect(location.current.search).toContain("controls=0"); // merged, not clobbered
  expect(location.current.hash).toBe("#frag");
});
