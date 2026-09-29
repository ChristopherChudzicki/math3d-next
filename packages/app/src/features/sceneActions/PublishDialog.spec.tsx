import { expect, onTestFinished, test } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { act, renderTestApp, screen, user, waitFor, within } from "@/test_util";

const renderOwnedScene = (overrides: Partial<Scene> = {}) => {
  const me = seedDb.withUser();
  const scene = seedDb.withSceneFromItems([], { author: me.id, ...overrides });
  return { scene, ...renderTestApp(`/${scene.key}`, { user: me }) };
};

const openDuplicate = async () => {
  await user.click(
    await screen.findByRole("button", { name: "More scene actions" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
  return screen.findByRole("dialog");
};

/** Holds scene POSTs until `release` is called, then fails them. */
const holdPosts = () => {
  const gate = Promise.withResolvers<void>();
  server.use(
    http.post(urls.scenes.list, async () => {
      await gate.promise;
      return HttpResponse.json({ detail: "late" }, { status: 500 });
    }),
  );
  return gate.resolve;
};

test("a titled scene publishes without asking for a title", async () => {
  const { scene, store } = renderOwnedScene();

  await openDuplicate();

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.title).toBe(`Copy of ${scene.title}`);
});

test("a failed publish offers the title step to retry, leaving the scene as it was", async () => {
  server.use(
    http.post(urls.scenes.list, () =>
      HttpResponse.json({ detail: "boom" }, { status: 500 }),
    ),
  );
  const { scene, store } = renderOwnedScene();

  const dialog = await openDuplicate();

  expect(
    await within(dialog).findByText(/something went wrong/i),
  ).toBeVisible();
  expect(within(dialog).getByLabelText("Title")).toHaveValue(
    `Copy of ${scene.title}`,
  );
  expect(store.getState().scene).toMatchObject({
    key: scene.key,
    title: scene.title,
  });
});

test("while the publish is in flight, the dialog can't be closed", async () => {
  const release = holdPosts();
  renderOwnedScene();

  const dialog = await openDuplicate();

  expect(within(dialog).getByText("Saving...")).toBeVisible();
  expect(within(dialog).queryByLabelText("Title")).toBeNull();
  expect(within(dialog).getByRole("button", { name: "Close" })).toBeDisabled();
  await user.keyboard("{Escape}");
  expect(dialog).toBeInTheDocument();
  release();
  expect(
    await within(dialog).findByText(/something went wrong/i),
  ).toBeVisible();
});

test("a copy of an untitled scene asks for a title, starting untitled", async () => {
  renderOwnedScene({ title: "" });

  const dialog = await openDuplicate();

  const title = within(dialog).getByLabelText("Title");
  expect(title).toHaveValue("");
  expect(title).toHaveAttribute("placeholder", "Untitled");
});

test("a blank title publishes the scene untitled", async () => {
  const { store } = renderOwnedScene({ title: "" });

  const dialog = await openDuplicate();
  await user.type(within(dialog).getByLabelText("Title"), "   ");
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.title).toBe("");
});

test("publishing from the title step keeps one dialog and moves focus to Copy link", async () => {
  renderOwnedScene({ title: "" });

  const dialog = await openDuplicate();
  await user.type(within(dialog).getByLabelText("Title"), "{Enter}");

  expect(await screen.findByRole("dialog", { name: "Scene saved!" })).toBe(
    dialog,
  );
  expect(
    within(dialog).getByRole("button", { name: "Copy link" }),
  ).toHaveFocus();
});

test("a padded title is published trimmed", async () => {
  const { store } = renderOwnedScene({ title: "" });

  const dialog = await openDuplicate();
  await user.type(within(dialog).getByLabelText("Title"), "  Spaced  ");
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.title).toBe("Spaced");
});

test("a copy of a legacy scene is not legacy", async () => {
  const { store } = renderOwnedScene({ isLegacy: true });
  await waitFor(() => expect(store.getState().scene.isLegacy).toBe(true));

  await openDuplicate();

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.isLegacy).toBe(false);
});

test("loading another scene closes the dialog", async () => {
  const other = seedDb.withSceneFromItems([]);
  const { router } = renderOwnedScene({ title: "" });

  const dialog = await openDuplicate();
  await act(() => router.navigate(`/${other.key}`));

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
});

test("a publish that lands after another scene loads leaves the user there", async () => {
  const gate = Promise.withResolvers<void>();
  const landed = Promise.withResolvers<void>();
  server.use(
    http.post(urls.scenes.list, async () => {
      await gate.promise;
    }),
  );
  const onResponse = ({ request }: { request: Request }) => {
    if (request.method === "POST") landed.resolve();
  };
  server.events.on("response:mocked", onResponse);
  onTestFinished(() => {
    server.events.removeListener("response:mocked", onResponse);
  });
  const other = seedDb.withSceneFromItems([]);
  const { router, store, location } = renderOwnedScene();

  await openDuplicate();
  await act(() => router.navigate(`/${other.key}`));
  await waitFor(() => expect(store.getState().scene.key).toBe(other.key));
  gate.resolve();
  await act(() => landed.promise);

  expect(location.current.pathname).toBe(`/${other.key}`);
  expect(store.getState().scene.key).toBe(other.key);
});
