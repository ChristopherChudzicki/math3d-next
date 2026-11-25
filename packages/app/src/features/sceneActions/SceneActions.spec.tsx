import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  onTestFinished,
  test,
  vi,
} from "vitest";
import { delay, http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { makeItem, seedDb, urls } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import {
  act,
  countRequests,
  expectToast,
  renameScene,
  renderTestApp,
  screen,
  user,
  waitFor,
  within,
  writeSessionDraft,
} from "@/test_util";
import { actions } from "@/store/scene/state/scene.slice";
import { readDraft } from "@/store/scene/drafts/storage";
import { PHONE_QUERY } from "@/config/breakpoints";

beforeAll(() => {
  Object.assign(window.navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});
afterAll(() => {
  // @ts-expect-error This is fake clipboard
  delete window.navigator.clipboard;
});

/** Bodies of the PATCH requests sent for `key`. */
const capturePatches = (key: string) => {
  const bodies: unknown[] = [];
  const listener = async ({ request }: { request: Request }) => {
    if (
      request.method === "PATCH" &&
      new URL(request.url).pathname.endsWith(`/v1/scenes/${key}/`)
    ) {
      bodies.push(await request.clone().json());
    }
  };
  server.events.on("request:start", listener);
  onTestFinished(() => {
    server.events.removeListener("request:start", listener);
  });
  return bodies;
};

const SAVED_SINCE = /was saved after these changes were made/;

/** Whether text matching `pattern` appears at any moment from now on. */
const watchForText = (pattern: RegExp) => {
  let seen = false;
  const observer = new MutationObserver(() => {
    seen ||= pattern.test(document.body.textContent ?? "");
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  onTestFinished(() => observer.disconnect());
  return () => seen;
};

const primary = () => screen.findByTestId("scene-action");
// The primary button stays focusable while it can't be used, so keyboard
// users keep their place.
const expectInert = (el: HTMLElement) => {
  expect(el).toHaveAttribute("aria-disabled", "true");
  expect(el).toBeEnabled();
};
// Both ways in: Base UI blocks the keypress and the click separately.
const tryToActivate = async (el: HTMLElement) => {
  act(() => el.focus());
  await user.keyboard("{Enter}");
  await user.click(el);
};
const menuEntries = async () => {
  await user.click(
    await screen.findByRole("button", { name: "More scene actions" }),
  );
  const entries = (await screen.findAllByRole("menuitem")).map(
    (el) => el.textContent,
  );
  await user.keyboard("{Escape}");
  return entries;
};
const noMenu = () =>
  expect(
    screen.queryByRole("button", { name: "More scene actions" }),
  ).toBeNull();
const renderOwnedScene = () => {
  const me = seedDb.withUser();
  const scene = seedDb.withSceneFromItems([], { author: me.id });
  return { scene, ...renderTestApp(`/${scene.key}`, { user: me }) };
};

test("a signed-out visitor gets Share and no menu", async () => {
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}`);

  expect(await primary()).toHaveTextContent(/^Share$/);
  noMenu();
});

test("an unsaved scene offers Save once edited, and no menu", async () => {
  renderTestApp("/", { isAuthenticated: true });

  expect(await primary()).toHaveTextContent(/^Save$/);
  expectInert(await primary());
  await tryToActivate(await primary());
  expect(screen.queryByRole("dialog")).toBeNull();
  await renameScene("edited");
  expect(await primary()).not.toHaveAttribute("aria-disabled", "true");
  noMenu();
});

test("an owned scene with edits saves in place", async () => {
  const { scene, store } = renderOwnedScene();
  const patches = capturePatches(scene.key);
  await renameScene(`${scene.title} edited`);

  expect(await primary()).toHaveTextContent(/^Save$/);
  expect(await menuEntries()).toEqual(["Duplicate", "Copy link"]);
  const sawSavedSince = watchForText(SAVED_SINCE);
  await user.click(await primary());

  await waitFor(
    () =>
      expect(screen.getByTestId("scene-action")).toHaveTextContent("Saved!"),
    { timeout: 2000 },
  );
  expect(screen.getAllByRole("status").map((el) => el.textContent)).toContain(
    "Saved!",
  );
  expect(store.getState().scene.dirty).toBe(false);
  expect(patches).toEqual([
    expect.objectContaining({ title: `${scene.title} edited` }),
  ]);
  // The save refetches the scene, newer than the store until markSaved.
  expect(sawSavedSince()).toBe(false);
});

test("an edit made while saving survives the save and stays unsaved", async () => {
  const gate = Promise.withResolvers<void>();
  // Returning nothing falls through to the mock API's PATCH handler.
  server.use(
    http.patch(urls.scenes.detail, async () => {
      await gate.promise;
    }),
  );
  const { scene, store } = renderOwnedScene();
  const patches = capturePatches(scene.key);
  await renameScene(`${scene.title} saved`);

  await user.click(await primary());
  expect(await primary()).toHaveTextContent(/^Saving\.\.\.$/);
  expectInert(await primary());
  expect(
    screen.getByRole("button", { name: "More scene actions" }),
  ).toBeDisabled();
  await tryToActivate(await primary());
  await renameScene(`${scene.title} saved later`);
  gate.resolve();

  await waitFor(
    () =>
      expect(screen.getByTestId("scene-action")).toHaveTextContent("Saved!"),
    { timeout: 2000 },
  );
  expect(store.getState().scene).toMatchObject({
    dirty: true,
    title: `${scene.title} saved later`,
  });
  expect(patches).toHaveLength(1);
  expect(readDraft(store.getState().scene.draftId)?.title).toBe(
    `${scene.title} saved later`,
  );
});

test("a save that lands after another scene loads removes the draft it saved", async () => {
  const gate = Promise.withResolvers<void>();
  server.use(
    http.patch(urls.scenes.detail, async () => {
      await gate.promise;
    }),
  );
  const { scene, store } = renderOwnedScene();
  await renameScene(`${scene.title} saved`);
  const draftId = writeSessionDraft(store);
  await user.click(await primary());
  const other = seedDb.withSceneFromItems([]);
  act(() => {
    store.dispatch(
      actions.setScene({
        key: other.key,
        author: null,
        items: other.items,
        order: other.itemOrder,
        title: other.title ?? "",
        isLegacy: false,
      }),
    );
  });
  expect(readDraft(draftId)).not.toBeNull();

  gate.resolve();

  await waitFor(() => expect(readDraft(draftId)).toBeNull());
});

test("a failed save frees the button and leaves the edit unsaved", async () => {
  server.use(
    http.patch(urls.scenes.detail, () =>
      HttpResponse.json({ detail: "boom" }, { status: 500 }),
    ),
  );
  const { scene, store } = renderOwnedScene();
  await renameScene(`${scene.title} edited`);

  await user.click(await primary());
  expect(await primary()).toHaveTextContent(/^Saving\.\.\.$/);

  await waitFor(
    () =>
      expect(screen.getByTestId("scene-action")).toHaveTextContent(/^Save$/),
    { timeout: 2000 },
  );
  expect(screen.getByTestId("scene-action")).not.toHaveAttribute(
    "aria-disabled",
    "true",
  );
  expect(store.getState().scene.dirty).toBe(true);
  await expectToast("Couldn’t save your changes. Try again.");
});

test("a failed save's toast closes once another scene loads", async () => {
  server.use(
    http.patch(urls.scenes.detail, () =>
      HttpResponse.json({ detail: "boom" }, { status: 500 }),
    ),
  );
  const { scene, router } = renderOwnedScene();
  const other = seedDb.withSceneFromItems([]);
  await renameScene(`${scene.title} edited`);
  await user.click(await primary());
  await expectToast("Couldn’t save your changes. Try again.");

  await act(() => router.navigate(`/${other.key}`));

  const region = screen.getByRole("region", { name: "Notifications" });
  await waitFor(() =>
    expect(
      within(region).queryByText("Couldn’t save your changes. Try again."),
    ).toBeNull(),
  );
});

test("an owned scene without edits copies its link", async () => {
  const { scene } = renderOwnedScene();

  expect(await primary()).toHaveTextContent(/^Copy link$/);
  expect(await menuEntries()).toEqual(["Duplicate"]);
  await user.click(await primary());

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    `${window.location.origin}/${scene.key}`,
  );
  expect(await primary()).toHaveTextContent(/^Copied!$/);
});

test("copying the link with unsaved edits says the link omits them", async () => {
  const { scene } = renderOwnedScene();
  await renameScene(`${scene.title} edited`);

  await user.click(
    await screen.findByRole("button", { name: "More scene actions" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Copy link" }));

  const dialog = await screen.findByRole("dialog", { name: "Copy link" });
  expect(within(dialog).getByText(/without your changes/i)).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: "Copy link" }));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    `${window.location.origin}/${scene.key}`,
  );
  expect(within(dialog).getByRole("status")).toHaveTextContent("Copied!");
});

test("a refused copy shows the link instead", async () => {
  vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
    new Error("denied"),
  );
  const { scene } = renderOwnedScene();

  await user.click(await primary());

  const dialog = await screen.findByRole("dialog", { name: "Copy link" });
  expect(within(dialog).getByLabelText("Shareable URL")).toHaveValue(
    `${window.location.origin}/${scene.key}`,
  );
  expect(within(dialog).getByText(/didn't allow copying/i)).toBeVisible();
  await waitFor(() =>
    expect(
      within(dialog).getByRole("button", { name: "Copy link" }),
    ).toHaveFocus(),
  );
  expect(await primary()).toHaveTextContent(/^Copy link$/);
});

test("the link step copies the link and announces it", async () => {
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}`);

  await user.click(await primary());
  const dialog = await screen.findByRole("dialog", { name: "Share scene" });
  await user.click(within(dialog).getByRole("button", { name: "Copy link" }));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    `${window.location.origin}/${scene.key}`,
  );
  expect(within(dialog).getByRole("status")).toHaveTextContent("Copied!");
});

test("someone else's scene offers Save a copy, saved as Copy of …", async () => {
  const author = seedDb.withUser();
  const scene = seedDb.withSceneFromItems([], { author: author.id });
  const { store } = renderTestApp(`/${scene.key}`, { isAuthenticated: true });

  expect(await primary()).toHaveTextContent(/^Save a copy$/);
  expect(await menuEntries()).toEqual(["Copy link"]);
  await user.click(await primary());

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.title).toBe(`Copy of ${scene.title}`);
});

test("Save a copy of an anonymous scene keeps its title", async () => {
  // Seeded scenes are author-less, like a visitor's own anonymous scene
  // after signing in.
  const scene = seedDb.withSceneFromItems([]);
  const { store } = renderTestApp(`/${scene.key}`, { isAuthenticated: true });

  await user.click(await primary());

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.title).toBe(scene.title);
});

test("a signed-out re-share of an unedited published scene reuses its link", async () => {
  const posts = countRequests("POST", "/v1/scenes/");
  renderTestApp("/");

  await user.click(await primary());
  const titleStep = await screen.findByRole("dialog", { name: "Share scene" });
  await user.click(within(titleStep).getByRole("button", { name: "Share" }));
  const link = await screen.findByLabelText<HTMLInputElement>("Shareable URL");
  const published = link.value;
  await user.click(screen.getByRole("button", { name: "Done" }));

  await user.click(await primary());

  const dialog = await screen.findByRole("dialog", { name: "Share scene" });
  expect(within(dialog).getByLabelText("Shareable URL")).toHaveValue(published);
  expect(posts.count).toBe(1);
  // Opened straight on the link step, it starts on Copy link.
  await waitFor(() =>
    expect(
      within(dialog).getByRole("button", { name: "Copy link" }),
    ).toHaveFocus(),
  );
});

test("a signed-out share of an edited scene mints a new link under its title", async () => {
  const item = makeItem(MIT.Point);
  const scene = seedDb.withSceneFromItems([item]);
  const { location, store } = renderTestApp(`/${scene.key}`);
  await waitFor(() => expect(store.getState().scene.key).toBe(scene.key));
  act(() => {
    store.dispatch(
      actions.setProperties({
        id: item.id,
        type: item.type,
        properties: { description: "moved" },
      }),
    );
  });

  await user.click(await primary());

  const link = await screen.findByLabelText<HTMLInputElement>("Shareable URL");
  expect(link.value).not.toBe(`${window.location.origin}/${scene.key}`);
  expect(location.current.pathname).not.toBe(`/${scene.key}`);
  expect(screen.getByText(/original link is unchanged/i)).toBeVisible();
  expect(store.getState().scene.title).toBe(scene.title);
});

test("the signed-out link step offers sign-in", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(`/${scene.key}`);

  await user.click(await primary());
  const dialog = await screen.findByRole("dialog", { name: "Share scene" });
  await user.click(within(dialog).getByRole("button", { name: "Sign in" }));

  expect(location.current.search).toContain("signin");
  expect(screen.queryByRole("dialog", { name: "Share scene" })).toBeNull();
});

test("no scene action is offered until the route's scene has loaded", async () => {
  server.use(http.get(urls.scenes.detail, () => delay("infinite")));
  const scene = seedDb.withSceneFromItems([]);
  const { queryClient } = renderTestApp(`/${scene.key}`);

  // Auth has settled, so only the scene load holds the action back.
  await waitFor(() =>
    expect(queryClient.getQueryState(["me"])?.status).not.toBe("pending"),
  );
  expect(screen.queryByTestId("scene-action")).toBeNull();
});

test("no scene action is offered while auth is still loading", async () => {
  server.use(http.get(urls.auth.me, () => delay("infinite")));
  renderTestApp("/");

  await screen.findByRole("heading", { level: 1 });
  expect(screen.queryByTestId("scene-action")).toBeNull();
});

describe("an opened draft whose scene was saved since", () => {
  const openAsDraft = (
    store: ReturnType<typeof renderTestApp>["store"],
    scene: ReturnType<typeof seedDb.withSceneFromItems>,
  ) =>
    act(() => {
      store.dispatch(
        actions.setScene({
          key: scene.key,
          author: scene.author ?? null,
          items: scene.items,
          order: scene.itemOrder,
          title: "Renamed in the draft",
          isLegacy: false,
          dirty: true,
          savedSince: true,
        }),
      );
    });

  test("warns its author, and Save a copy saves it as a new scene", async () => {
    const { scene, store } = renderOwnedScene();
    await primary();
    expect(screen.queryByText(SAVED_SINCE)).toBeNull();
    openAsDraft(store, scene);

    const banner = await screen.findByText(SAVED_SINCE);
    expect(banner).toHaveTextContent(`${scene.title} was saved after`);
    await user.click(
      within(banner).getByRole("button", { name: "Save a copy" }),
    );

    await screen.findByRole("dialog", { name: "Scene saved!" });
    expect(store.getState().scene.key).not.toBe(scene.key);
    expect(screen.queryByText(SAVED_SINCE)).toBeNull();
  });

  test("goes away once the author saves over the newer version, as does the draft", async () => {
    const { scene, store } = renderOwnedScene();
    await primary();
    openAsDraft(store, scene);
    await screen.findByText(SAVED_SINCE);
    const draftId = writeSessionDraft(store);

    await user.click(await primary());

    await waitFor(() => expect(screen.queryByText(SAVED_SINCE)).toBeNull());
    expect(readDraft(draftId)).toBeNull();
  });

  test("doesn't warn anyone else, whose Save makes a copy anyway", async () => {
    const author = seedDb.withUser();
    const scene = seedDb.withSceneFromItems([], { author: author.id });
    const { store } = renderTestApp(`/${scene.key}`, {
      isAuthenticated: true,
    });
    await primary();
    openAsDraft(store, scene);

    expect(await primary()).toHaveTextContent(/^Save a copy$/);
    expect(screen.queryByText(SAVED_SINCE)).toBeNull();
  });
});

describe("on a phone", () => {
  // jsdom has no matchMedia, so components render their desktop branch.
  let phone = true;
  const listeners = new Set<() => void>();
  const setPhone = (next: boolean) => {
    phone = next;
    act(() => listeners.forEach((listener) => listener()));
  };
  beforeEach(() => {
    phone = true;
    window.matchMedia = ((query: string) => ({
      get matches() {
        return phone && query === PHONE_QUERY;
      },
      addEventListener: (_: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) =>
        listeners.delete(listener),
    })) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    listeners.clear();
    // @ts-expect-error jsdom defines no matchMedia to restore
    delete window.matchMedia;
  });

  const openMenu = async () =>
    user.click(await screen.findByRole("button", { name: "Scene actions" }));

  test("a lone action is an icon button named for it", async () => {
    const scene = seedDb.withSceneFromItems([]);
    renderTestApp(`/${scene.key}`);

    const share = await screen.findByRole("button", { name: "Share" });
    expect(share).toHaveTextContent(/^$/);
    await user.click(share);

    expect(
      await screen.findByRole("dialog", { name: "Share scene" }),
    ).toBeVisible();
  });

  test("an unsaved scene's Save icon stays inert until edited", async () => {
    renderTestApp("/", { isAuthenticated: true });

    const save = await screen.findByRole("button", { name: "Save" });
    expect(save).toHaveTextContent(/^$/);
    expectInert(save);
    await tryToActivate(save);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("several actions are one menu button, the primary listed first", async () => {
    const { scene } = renderOwnedScene();

    await openMenu();
    expect(
      (await screen.findAllByRole("menuitem")).map((el) => el.textContent),
    ).toEqual(["Copy link", "Duplicate"]);
    await user.keyboard("{Escape}");

    await renameScene(`${scene.title} edited`);
    await openMenu();
    expect(
      (await screen.findAllByRole("menuitem")).map((el) => el.textContent),
    ).toEqual(["Save", "Copy link", "Duplicate"]);
  });

  test("Save from the menu saves in place and announces each step", async () => {
    const { scene, store } = renderOwnedScene();
    await renameScene(`${scene.title} edited`);

    await openMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Save" }));

    const statuses = () =>
      screen.getAllByRole("status").map((el) => el.textContent);
    await waitFor(() => expect(statuses()).toContain("Saving..."));
    await waitFor(() => expect(statuses()).toContain("Saved!"), {
      timeout: 2000,
    });
    expect(store.getState().scene.dirty).toBe(false);
  });

  test("closing a dialog opened from the menu returns focus to the menu button", async () => {
    const { scene } = renderOwnedScene();
    await renameScene(`${scene.title} edited`);

    await openMenu();
    await user.click(
      await screen.findByRole("menuitem", { name: "Copy link" }),
    );
    const dialog = await screen.findByRole("dialog", { name: "Copy link" });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Scene actions" }),
      ).toHaveFocus(),
    );
  });

  test("focus follows the control across the breakpoint", async () => {
    renderOwnedScene();
    const trigger = await screen.findByRole("button", {
      name: "Scene actions",
    });
    act(() => trigger.focus());

    setPhone(false);

    expect(await primary()).toHaveTextContent(/^Copy link$/);
    expect(await primary()).toHaveFocus();
  });
});
