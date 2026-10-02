import { test, expect } from "vitest";
import { delay, http } from "msw";
import { server } from "@math3d/mock-api/node";
import { urls } from "@math3d/mock-api";
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
    isAuthenticated: true,
    trigger: "Open User Menu",
    otherTrigger: "Open Menu",
    headerSignIn: false,
    items: [
      "My Scenes",
      "Examples",
      "Function Reference",
      "Contact",
      "Delete Account",
      "Sign out",
    ],
  },
  {
    isAuthenticated: false,
    trigger: "Open Menu",
    otherTrigger: "Open User Menu",
    headerSignIn: true,
    items: ["Sign in", "Examples", "Function Reference", "Contact"],
  },
])(
  "the header offers the items for its auth status (authenticated=$isAuthenticated)",
  async ({ isAuthenticated, trigger, otherTrigger, headerSignIn, items }) => {
    const { queryClient } = renderTestApp("", { isAuthenticated });
    // Item visibility is gated on the ["me"] auth query resolving, and the
    // header has no positive anchor for the absent state (e.g. "Sign in" is
    // simply absent when authenticated). Wait for auth to settle so these
    // presence/absence assertions aren't false-greens.
    await waitForAppReady(queryClient);

    // The avatar is the signed-in trigger and the hamburger every other state,
    // including the pending one waited out above.
    expect(screen.queryByRole("button", { name: otherTrigger })).toBeNull();
    expect(!!screen.queryByRole("button", { name: "Sign in" })).toBe(
      headerSignIn,
    );

    await user.click(screen.getByRole("button", { name: trigger }));
    const menu = await screen.findByRole("menu", { name: trigger });
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((el) => el.textContent),
    ).toEqual(items);
  },
);

test("while auth is loading, the menu doesn't offer Sign in", async () => {
  // A signed-in user whose ["me"] query hasn't answered yet: offering to sign
  // in would be the wrong guess.
  server.use(http.get(urls.auth.usersMe, () => delay("infinite")));
  renderTestApp("", { isAuthenticated: true });
  await user.click(await screen.findByRole("button", { name: "Open Menu" }));
  const menu = await screen.findByRole("menu", { name: "Open Menu" });
  expect(
    within(menu)
      .getAllByRole("menuitem")
      .map((el) => el.textContent),
  ).toEqual(["Examples", "Function Reference", "Contact"]);
});

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
  expect(within(account).getAllByRole("menuitem")).toEqual(
    screen.getAllByRole("menuitem"),
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

test.each([
  {
    isAuthenticated: true,
    trigger: "Open User Menu",
    item: "My Scenes",
    list: "me",
  },
  {
    isAuthenticated: false,
    trigger: "Open Menu",
    item: "Examples",
    list: "examples",
  },
])(
  "the $item menu item opens list=$list",
  async ({ isAuthenticated, trigger, item, list }) => {
    const { location } = renderTestApp("", { isAuthenticated });
    await user.click(await screen.findByRole("button", { name: trigger }));
    await user.click(await screen.findByRole("menuitem", { name: item }));
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
