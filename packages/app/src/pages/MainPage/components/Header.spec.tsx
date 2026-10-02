import { test, expect } from "vitest";
import invariant from "tiny-invariant";
import {
  renderTestApp,
  screen,
  user,
  waitFor,
  waitForAppReady,
  within,
} from "@/test_util";

test.each([
  {
    authStatus: true,
    trigger: "Open User Menu",
    otherTrigger: "Open Menu",
    expected: { hasSigin: false, hasSigout: true },
  },
  {
    authStatus: false,
    trigger: "Open Menu",
    otherTrigger: "Open User Menu",
    expected: { hasSigin: true, hasSigout: false },
  },
])(
  "Header includes signin / signout links based on current auth status (authenticated=$authStatus)",
  async ({ authStatus, trigger, otherTrigger, expected }) => {
    const { queryClient } = renderTestApp("", { isAuthenticated: authStatus });
    // Sign in/out visibility is gated on the ["me"] auth query resolving, and
    // the header has no positive anchor for the absent state (e.g. "Sign in"
    // is simply absent when authenticated). Wait for auth to settle so these
    // presence/absence assertions aren't false-greens.
    await waitForAppReady(queryClient);

    const signin = screen.queryByRole("button", { name: "Sign in" });

    // The avatar is the signed-in trigger and the hamburger every other state,
    // including the pending one waited out above.
    expect(screen.queryByRole("button", { name: otherTrigger })).toBeNull();

    const button = screen.getByRole("button", { name: trigger });
    await user.click(button);
    await screen.findByRole("menu");

    const signout = screen.queryByRole("menuitem", { name: "Sign out" });

    expect(!!signin).toBe(expected.hasSigin);
    expect(!!signout).toBe(expected.hasSigout);
  },
);

test("Login button opens the sign-in dialog", async () => {
  const { location } = renderTestApp("", { isAuthenticated: false });
  const signin = await screen.findByRole("button", { name: "Sign in" });
  await user.click(signin);
  expect(location.current.search).toContain("signin");
});

test("Contact links to the GitHub issues page in a new tab", async () => {
  renderTestApp("", { isAuthenticated: false });
  const button = screen.getByRole("button", { name: "Open Menu" });
  await user.click(button);
  const contact = await screen.findByRole("menuitem", { name: "Contact" });
  expect(contact).toHaveAttribute("href", import.meta.env.VITE_ISSUE_URL);
  expect(contact).toHaveAttribute("target", "_blank");
  expect(contact).toHaveAttribute("rel", "noreferrer");
});

test("Function Reference opens the reference page in a new tab", async () => {
  renderTestApp("", { isAuthenticated: false });
  await user.click(screen.getByRole("button", { name: "Open Menu" }));
  const reference = await screen.findByRole("menuitem", {
    name: "Function Reference",
  });
  expect(reference).toHaveAttribute("href", "/app/help/reference");
  expect(reference).toHaveAttribute("target", "_blank");
});

test("the signed-in menu's items are grouped under the account's email", async () => {
  const { user: me } = renderTestApp("", { isAuthenticated: true });
  invariant(me);
  await user.click(
    await screen.findByRole("button", { name: "Open User Menu" }),
  );

  const account = await screen.findByRole("group", { name: me.email });
  expect(within(account).getByRole("menuitem", { name: "Sign out" })).toBe(
    screen.getByRole("menuitem", { name: "Sign out" }),
  );
  expect(screen.getByTestId("username-display")).toHaveTextContent(
    me.email,
  );
});

test("Sign in in the menu opens the sign-in dialog", async () => {
  const { location } = renderTestApp("", { isAuthenticated: false });
  await user.click(screen.getByRole("button", { name: "Open Menu" }));
  await user.click(await screen.findByRole("menuitem", { name: "Sign in" }));
  expect(location.current.search).toContain("signin");
});

test("Sign out opens logout overlay", async () => {
  const { location } = renderTestApp("", { isAuthenticated: true });
  const button = await screen.findByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const signout = await screen.findByRole("menuitem", { name: "Sign out" });
  await user.click(signout);
  expect(location.current.search).toContain("overlay=logout");
});

test("Delete Account opens the delete-account overlay", async () => {
  const { location } = renderTestApp("", { isAuthenticated: true });
  const button = await screen.findByRole("button", { name: "Open User Menu" });
  await user.click(button);
  const deleteAccount = await screen.findByRole("menuitem", {
    name: "Delete Account",
  });
  await user.click(deleteAccount);
  expect(location.current.search).toContain("overlay=delete-account");
});

test.each([
  { isAuthenticated: true, list: "me" },
  { isAuthenticated: false, list: "examples" },
])(
  "the scenes button opens list=$list (authenticated=$isAuthenticated)",
  async ({ isAuthenticated, list }) => {
    const { location, queryClient } = renderTestApp("", { isAuthenticated });
    await waitForAppReady(queryClient);

    await user.click(screen.getByRole("button", { name: "Open scenes" }));

    expect(location.current.search).toContain("overlay=scenes");
    expect(location.current.search).toContain(`list=${list}`);
  },
);

test("closing the scenes dialog returns focus to the scenes button, even when a menu item opened it", async () => {
  renderTestApp("", { isAuthenticated: true });
  await user.click(
    await screen.findByRole("button", { name: "Open User Menu" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "My Scenes" }));
  await screen.findByRole("dialog", { name: "Scenes" });

  await user.keyboard("{Escape}");

  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Open scenes" })).toHaveFocus(),
  );
});
