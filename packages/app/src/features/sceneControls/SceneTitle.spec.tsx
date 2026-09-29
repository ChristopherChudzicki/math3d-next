import { expect, test } from "vitest";
import { seedDb } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import {
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

const waitForLoad = async (
  store: ReturnType<typeof renderScene>["store"],
  key: string,
) => waitFor(() => expect(store.getState().scene.key).toBe(key));

test("the scene title is the page heading", async () => {
  const { scene, store } = renderScene();
  await waitForLoad(store, scene.key);

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    `${scene.title}`,
  );
});

test("an untitled scene's heading reads Untitled", async () => {
  const { scene, store } = renderScene({ title: "" });
  await waitForLoad(store, scene.key);

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "Untitled",
  );
});

test("renaming changes the heading and leaves the scene unsaved", async () => {
  const { scene, store } = renderScene();
  await waitForLoad(store, scene.key);

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
  const { scene, store } = renderScene();
  await waitForLoad(store, scene.key);

  await user.click(screen.getByRole("button", { name: "Rename scene" }));
  const dialog = await screen.findByRole("dialog", { name: "Rename scene" });
  await user.click(within(dialog).getByRole("button", { name: "Rename" }));

  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(store.getState().scene.dirty).toBe(false);
});
