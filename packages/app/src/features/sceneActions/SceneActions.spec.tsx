import { afterAll, beforeAll, expect, onTestFinished, test, vi } from "vitest";
import { delay, http } from "msw";
import { server } from "@math3d/mock-api/node";
import { makeItem, seedDb, urls } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { act, renderTestApp, screen, user, waitFor, within } from "@/test_util";
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

const primary = () => screen.findByTestId("scene-action");
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
  expect(await primary()).toBeDisabled();
  await user.type(await screen.findByLabelText("Scene Title"), " edited");
  expect(await primary()).toBeEnabled();
  noMenu();
});

test("an owned scene with edits saves in place", async () => {
  const { scene } = renderOwnedScene();
  const patches = countRequests("PATCH", `/v1/scenes/${scene.key}/`);
  await user.type(await screen.findByLabelText("Scene Title"), " edited");

  expect(await primary()).toHaveTextContent(/^Save$/);
  expect(await menuEntries()).toEqual(["Duplicate", "Copy link"]);
  await user.click(await primary());

  await waitFor(async () =>
    expect(await primary()).toHaveTextContent(/^Saved!$/),
  );
  expect(screen.getAllByRole("status").map((el) => el.textContent)).toContain(
    "Saved!",
  );
  await waitFor(
    () =>
      expect(screen.getByTestId("scene-action")).toHaveTextContent(
        /^Copy link$/,
      ),
    { timeout: 3000 },
  );
  expect(patches.count).toBe(1);
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
  await user.type(await screen.findByLabelText("Scene Title"), " edited");

  await user.click(
    await screen.findByRole("button", { name: "More scene actions" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Copy link" }));

  const dialog = await screen.findByRole("dialog", { name: "Copy Link" });
  expect(within(dialog).getByLabelText("Shareable URL")).toHaveValue(
    `${window.location.origin}/${scene.key}`,
  );
  expect(
    within(dialog).getByText(/without your unsaved changes/i),
  ).toBeVisible();
});

test("a refused copy shows the link instead", async () => {
  vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
    new Error("denied"),
  );
  const { scene } = renderOwnedScene();

  await user.click(await primary());

  const dialog = await screen.findByRole("dialog", { name: "Copy Link" });
  expect(within(dialog).getByLabelText("Shareable URL")).toHaveValue(
    `${window.location.origin}/${scene.key}`,
  );
  expect(await primary()).toHaveTextContent(/^Copy link$/);
});

test("the link dialog's Copy button copies the link", async () => {
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}`);

  await user.click(await primary());
  const dialog = await screen.findByRole("dialog", { name: "Share Scene" });
  await user.click(within(dialog).getByRole("button", { name: "Copy" }));

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    `${window.location.origin}/${scene.key}`,
  );
  expect(within(dialog).getByText("Copied!")).toBeVisible();
});

test("someone else's scene offers Save a Copy, prefilled Copy of …", async () => {
  const author = seedDb.withUser();
  const scene = seedDb.withSceneFromItems([], { author: author.id });
  renderTestApp(`/${scene.key}`, { isAuthenticated: true });

  expect(await primary()).toHaveTextContent(/^Save a Copy$/);
  expect(await menuEntries()).toEqual(["Copy link"]);
  await user.click(await primary());

  const dialog = await screen.findByRole("dialog", { name: "Save a Copy" });
  expect(within(dialog).getByLabelText("Title")).toHaveValue(
    `Copy of ${scene.title}`,
  );
});

test("Save a Copy of an anonymous scene keeps its title", async () => {
  // Seeded scenes are author-less, like a visitor's own anonymous scene
  // after signing in.
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}`, { isAuthenticated: true });

  await user.click(await primary());

  const dialog = await screen.findByRole("dialog", { name: "Save a Copy" });
  expect(within(dialog).getByLabelText("Title")).toHaveValue(scene.title);
});

test("a signed-out re-share of an unedited published scene reuses its link", async () => {
  const posts = countRequests("POST", "/v1/scenes/");
  renderTestApp("/");

  await user.click(await primary());
  const titleStep = await screen.findByRole("dialog", { name: "Share Scene" });
  await user.click(within(titleStep).getByRole("button", { name: "Share" }));
  const link = await screen.findByLabelText<HTMLInputElement>("Shareable URL");
  const published = link.value;
  await user.click(screen.getByRole("button", { name: "OK" }));

  await user.click(await primary());

  expect(
    await screen.findByLabelText<HTMLInputElement>("Shareable URL"),
  ).toHaveValue(published);
  expect(posts.count).toBe(1);
});

test("a signed-out share of an edited scene mints a new link, prefilled with the scene's title", async () => {
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
  const dialog = await screen.findByRole("dialog", { name: "Share Scene" });
  expect(within(dialog).getByLabelText("Title")).toHaveValue(scene.title);
  expect(within(dialog).getByText(/original link is unchanged/i)).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: "Share" }));

  const link = await screen.findByLabelText<HTMLInputElement>("Shareable URL");
  expect(link.value).not.toBe(`${window.location.origin}/${scene.key}`);
  expect(location.current.pathname).not.toBe(`/${scene.key}`);
});

test("the link step shows the real link on a small screen", async () => {
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
  const dialog = await screen.findByRole("dialog", { name: "Share Scene" });
  await user.click(within(dialog).getByRole("button", { name: "Sign in" }));

  expect(location.current.search).toContain("overlay=login");
  expect(screen.queryByRole("dialog", { name: "Share Scene" })).toBeNull();
});

test("no scene action is offered while auth is still loading", async () => {
  server.use(http.get(urls.auth.usersMe, () => delay("infinite")));
  renderTestApp("/");

  await screen.findByLabelText("Scene Title");
  expect(screen.queryByTestId("scene-action")).toBeNull();
});
