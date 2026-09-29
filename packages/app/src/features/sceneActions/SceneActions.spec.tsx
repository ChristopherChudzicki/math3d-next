import { afterAll, beforeAll, expect, onTestFinished, test, vi } from "vitest";
import { delay, http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { makeItem, seedDb, urls } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import {
  act,
  renameScene,
  renderTestApp,
  screen,
  user,
  waitFor,
  within,
} from "@/test_util";
import { actions } from "@/features/sceneControls/mathItems";

beforeAll(() => {
  Object.assign(window.navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});
afterAll(() => {
  // @ts-expect-error This is fake clipboard
  delete window.navigator.clipboard;
});

const countRequests = (method: string, pathSuffix: string) => {
  const seen = { count: 0 };
  const listener = ({ request }: { request: Request }) => {
    if (
      request.method === method &&
      new URL(request.url).pathname.endsWith(pathSuffix)
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

const primary = () => screen.findByTestId("scene-action");
// The primary button stays focusable while it can't be used, so keyboard
// users keep their place.
const expectInert = (el: HTMLElement) => {
  expect(el).toHaveAttribute("aria-disabled", "true");
  expect(el).toBeEnabled();
};
const pressEnterOn = async (el: HTMLElement) => {
  act(() => el.focus());
  await user.keyboard("{Enter}");
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
  await pressEnterOn(await primary());
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
  await pressEnterOn(await primary());
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

  expect(
    await screen.findByLabelText<HTMLInputElement>("Shareable URL"),
  ).toHaveValue(published);
  expect(posts.count).toBe(1);
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

test("the scene action works on a small screen", async () => {
  // JSDOM has no matchMedia. Not vi.stubGlobal: undoing it with
  // vi.unstubAllGlobals also drops setupTests' ResizeObserver stub.
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("max-width"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  onTestFinished(() => {
    // @ts-expect-error Removing the stand-in added above
    delete window.matchMedia;
  });
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}`);

  await user.click(await primary());

  expect(
    await screen.findByLabelText<HTMLInputElement>("Shareable URL"),
  ).toHaveValue(`${window.location.origin}/${scene.key}`);
});

test("the signed-out link step offers sign-in", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = renderTestApp(`/${scene.key}`);

  await user.click(await primary());
  const dialog = await screen.findByRole("dialog", { name: "Share scene" });
  await user.click(within(dialog).getByRole("button", { name: "Sign in" }));

  expect(location.current.search).toContain("overlay=login");
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
  server.use(http.get(urls.auth.usersMe, () => delay("infinite")));
  renderTestApp("/");

  await screen.findByRole("heading", { level: 1 });
  expect(screen.queryByTestId("scene-action")).toBeNull();
});
