import { expect, test } from "vitest";
import { http } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import {
  act,
  renameScene,
  renderTestApp,
  screen,
  user,
  waitFor,
  within,
} from "@/test_util";

const renderScene = (overrides: Partial<Scene> = {}) => {
  const scene = seedDb.withSceneFromItems([], overrides);
  return { scene, ...renderTestApp(`/${scene.key}`) };
};

const openRenameDialog = async () => {
  await user.click(await screen.findByRole("button", { name: "Rename scene" }));
  return screen.findByRole("dialog", { name: "Rename scene" });
};

test("an untitled scene's heading reads Untitled", async () => {
  renderScene({ title: "" });

  expect(
    await screen.findByRole("heading", { level: 1, name: "Untitled" }),
  ).toBeVisible();
});

test("renaming changes the heading and leaves the scene unsaved", async () => {
  const { scene, store } = renderScene();
  await screen.findByRole("heading", { level: 1, name: scene.title ?? "" });

  await renameScene("Renamed");

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Renamed",
  );
  expect(store.getState().scene).toMatchObject({
    title: "Renamed",
    dirty: true,
  });
});

test("confirming the rename dialog unchanged leaves the scene clean", async () => {
  const { store } = renderScene();

  const dialog = await openRenameDialog();
  await user.click(within(dialog).getByRole("button", { name: "Rename" }));

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(store.getState().scene.dirty).toBe(false);
});

test("loading another scene closes the rename dialog", async () => {
  const other = seedDb.withSceneFromItems([]);
  const { router } = renderScene();

  const dialog = await openRenameDialog();
  await act(() => router.navigate(`/${other.key}`));

  await screen.findByRole("heading", { level: 1, name: other.title ?? "" });
  expect(dialog).not.toBeInTheDocument();
});

test("the heading and rename control wait for the route's scene to load", async () => {
  const other = seedDb.withSceneFromItems([]);
  const { scene, router } = renderScene();
  await screen.findByRole("heading", { level: 1, name: scene.title ?? "" });
  const gate = Promise.withResolvers<void>();
  // Returning nothing falls through to the mock API's GET handler.
  server.use(
    http.get(urls.scenes.detail, async () => {
      await gate.promise;
    }),
  );

  await act(() => router.navigate(`/${other.key}`));

  expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  expect(screen.queryByRole("button", { name: "Rename scene" })).toBeNull();
  gate.resolve();
  expect(
    await screen.findByRole("heading", { level: 1, name: other.title ?? "" }),
  ).toBeVisible();
});

test("publishing keeps the heading in place", async () => {
  const me = seedDb.withUser();
  const scene = seedDb.withSceneFromItems([], { author: me.id });
  renderTestApp(`/${scene.key}`, { user: me });
  const heading = await screen.findByRole("heading", {
    level: 1,
    name: scene.title ?? "",
  });

  await user.click(
    await screen.findByRole("button", { name: "More scene actions" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));
  await screen.findByRole("dialog", { name: "Scene saved!" });

  expect(heading).toBeInTheDocument();
  expect(heading).toHaveTextContent(`Copy of ${scene.title}`);
});
