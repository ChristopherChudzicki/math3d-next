import { expect, test } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";

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
  return screen.findByRole("dialog", { name: "Save a copy" });
};

test("a failed publish shows the error and leaves the scene as it was", async () => {
  server.use(
    http.post(urls.scenes.list, () =>
      HttpResponse.json({ detail: "boom" }, { status: 500 }),
    ),
  );
  const { scene, store } = renderOwnedScene();

  const dialog = await openDuplicate();
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  expect(
    await within(dialog).findByText(/something went wrong/i),
  ).toBeVisible();
  expect(store.getState().scene).toMatchObject({
    key: scene.key,
    title: scene.title,
  });
});

test("a blank title publishes the scene untitled", async () => {
  const { store } = renderOwnedScene();

  const dialog = await openDuplicate();
  const title = within(dialog).getByLabelText("Title");
  await user.clear(title);
  await user.type(title, "   ");
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.title).toBe("");
});

test("a copy of an untitled scene starts untitled", async () => {
  renderOwnedScene({ title: "" });

  const dialog = await openDuplicate();

  const title = within(dialog).getByLabelText("Title");
  expect(title).toHaveValue("");
  expect(title).toHaveAttribute("placeholder", "Untitled");
});

test("publishing keeps one dialog and moves focus to Copy link", async () => {
  renderOwnedScene();

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
  const { store } = renderOwnedScene();

  const dialog = await openDuplicate();
  const title = within(dialog).getByLabelText("Title");
  await user.clear(title);
  await user.type(title, "  Spaced  ");
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.title).toBe("Spaced");
});

test("while the publish is in flight, the dialog can be neither resubmitted nor closed", async () => {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.use(
    http.post(urls.scenes.list, async () => {
      await gate;
      return HttpResponse.json({ detail: "late" }, { status: 500 });
    }),
  );
  renderOwnedScene();

  const dialog = await openDuplicate();
  const save = within(dialog).getByRole("button", { name: "Save" });
  await user.click(save);

  await waitFor(() => expect(save).toHaveTextContent("Saving..."));
  expect(save).toBeDisabled();
  expect(within(dialog).getByRole("button", { name: "Close" })).toBeDisabled();
  await user.keyboard("{Escape}");
  expect(dialog).toBeInTheDocument();
  release();
  await waitFor(() => expect(save).toBeEnabled());
  expect(save).toHaveTextContent("Save");
});

test("a copy of a legacy scene is not legacy", async () => {
  const { store } = renderOwnedScene({ isLegacy: true });
  await waitFor(() => expect(store.getState().scene.isLegacy).toBe(true));

  const dialog = await openDuplicate();
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  await screen.findByRole("dialog", { name: "Scene saved!" });
  expect(store.getState().scene.isLegacy).toBe(false);
});
