import { afterEach, expect, test, vi } from "vitest";
import { nanoid } from "@reduxjs/toolkit";
import userEvent from "@testing-library/user-event";
import { makeItem, seedDb } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import {
  act,
  expectToast,
  renderTestApp,
  screen,
  user,
  waitFor,
  within,
} from "@/test_util";
import {
  listDrafts,
  readDraft,
  writeDraft,
} from "@/store/scene/drafts/storage";
import type { DraftRecord } from "@/store/scene/drafts/storage";

type SavedScene = ReturnType<typeof seedDb.withSceneFromItems>;

/** A draft of `scene` as it was saved. */
const draftOf = (scene: SavedScene, updatedAt = Date.now()): DraftRecord => ({
  id: nanoid(),
  title: scene.title ?? "",
  items: scene.items,
  itemOrder: scene.itemOrder,
  key: scene.key,
  author: scene.author ?? null,
  baseModifiedDate: scene.modifiedDate,
  createdAt: updatedAt,
  updatedAt,
});

const newSceneDraft = (updatedAt?: number): DraftRecord => ({
  ...draftOf(seedDb.withSceneFromItems([makeItem(MIT.Point)]), updatedAt),
  key: null,
  author: null,
  baseModifiedDate: null,
});

const openUnsaved = async () => {
  const view = renderTestApp("/?overlay=scenes&list=unsaved");
  const dialog = await screen.findByRole("dialog", { name: "Scenes" });
  return { ...view, dialog };
};

const rowNames = () =>
  within(screen.getByRole("list"))
    .getAllByRole("button", { name: /^(?!Delete)/ })
    .map((button) => button.textContent);

afterEach(() => {
  vi.useRealTimers();
});

test("rows are newest first, and leave out this tab's own session", async () => {
  const older = newSceneDraft(Date.now() - 2000);
  const newer = newSceneDraft(Date.now() - 1000);
  writeDraft(older);
  writeDraft(newer);
  const { store } = await openUnsaved();
  await screen.findByRole("button", { name: newer.title });

  act(() => {
    writeDraft({ ...newSceneDraft(), id: store.getState().scene.draftId });
  });

  expect(rowNames()).toEqual([newer.title, older.title]);
  expect(screen.getByRole("tab", { name: "Unsaved (2)" })).toBeVisible();
});

test("a row names a new scene by its title, and a saved one as changes to it", async () => {
  const saved = draftOf(seedDb.withSceneFromItems([]));
  const untitled = { ...newSceneDraft(), title: "" };
  writeDraft(saved);
  writeDraft(untitled);
  await openUnsaved();

  expect(
    await screen.findByRole("button", { name: `Changes to ${saved.title}` }),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Untitled" })).toBeVisible();
  expect(
    screen.getByRole("button", {
      name: `Delete unsaved changes to ${saved.title}`,
    }),
  ).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Delete unsaved scene Untitled" }),
  ).toBeVisible();
});

test("a row describes when it was last changed and how many objects it has", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 10, 20, 18, 0));
  const threePoints = seedDb.withSceneFromItems([
    makeItem(MIT.Point),
    makeItem(MIT.Point),
    makeItem(MIT.Point),
  ]);
  const drafts = [
    draftOf(
      seedDb.withSceneFromItems([makeItem(MIT.Point)]),
      +new Date(2026, 10, 20, 15, 42),
    ),
    draftOf(threePoints, +new Date(2026, 10, 19, 15, 42)),
    draftOf(seedDb.withSceneFromItems([]), +new Date(2026, 10, 17, 9, 5)),
  ];
  drafts.forEach((draft) => writeDraft(draft));
  await openUnsaved();

  const description = (draft: DraftRecord) =>
    screen.getByRole("button", { name: `Changes to ${draft.title}` });
  expect(await screen.findByText("Today 3:42 pm")).toHaveAttribute(
    "datetime",
    new Date(2026, 10, 20, 15, 42).toISOString(),
  );
  expect(description(drafts[0])).toHaveAccessibleDescription(
    "Today 3:42 pm · 1 object",
  );
  expect(description(drafts[1])).toHaveAccessibleDescription(
    "Yesterday 3:42 pm · 3 objects",
  );
  expect(description(drafts[2])).toHaveAccessibleDescription(
    "Tue, Nov 17 · 0 objects",
  );
});

test("with no drafts, the tab explains what will appear", async () => {
  await openUnsaved();

  expect(
    await screen.findByText(
      "Scenes you edit but don’t save appear here for 7 days.",
    ),
  ).toBeVisible();
  expect(screen.getByRole("tab", { name: "Unsaved" })).toBeVisible();
});

test("with drafts, the tab says where they come from", async () => {
  writeDraft(newSceneDraft());
  await openUnsaved();

  expect(
    await screen.findByText("Unsaved work from this browser, kept for 7 days."),
  ).toBeVisible();
});

test("opening a draft loads it as unsaved work at its scene's URL, under a new id", async () => {
  const scene = seedDb.withSceneFromItems([makeItem(MIT.Point)]);
  const draft = { ...draftOf(scene), title: "Edited title" };
  writeDraft(draft);
  const { store, location } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );

  await waitFor(() => expect(location.current.pathname).toBe(`/${scene.key}`));
  expect(location.current.search).toBe("");
  const state = store.getState().scene;
  expect(state).toMatchObject({
    key: scene.key,
    title: draft.title,
    dirty: true,
    savedSince: false,
  });
  expect(listDrafts().map((d) => d.id)).toEqual([state.draftId]);
  expect(state.draftId).not.toBe(draft.id);
});

test("a draft whose scene was saved since opens flagged as such", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const draft = {
    ...draftOf(scene),
    baseModifiedDate: new Date(
      Date.parse(scene.modifiedDate) - 1000,
    ).toISOString(),
  };
  writeDraft(draft);
  const { store, location } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );

  await waitFor(() => expect(location.current.pathname).toBe(`/${scene.key}`));
  expect(store.getState().scene.savedSince).toBe(true);
});

test("a draft whose scene was deleted opens as a new scene", async () => {
  const draft = { ...draftOf(seedDb.withSceneFromItems([])), key: "deleted" };
  writeDraft(draft);
  const { store, location } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );

  await waitFor(() => expect(location.current.search).toBe(""));
  expect(location.current.pathname).toBe("/");
  expect(store.getState().scene).toMatchObject({
    key: null,
    author: null,
    title: draft.title,
  });
});

test("a draft that can't be loaded is removed, and the editor keeps its scene", async () => {
  const draft = newSceneDraft();
  writeDraft({
    ...draft,
    items: draft.items.map((item) => ({
      ...item,
      type: "Gone",
    })) as unknown as DraftRecord["items"],
  });
  const { store, location } = await openUnsaved();
  const before = store.getState().scene.draftId;

  await user.click(await screen.findByRole("button", { name: draft.title }));

  await expectToast("This unsaved work couldn’t be opened, so it was removed.");
  expect(readDraft(draft.id)).toBeNull();
  expect(store.getState().scene.draftId).toBe(before);
  expect(location.current.search).toContain("list=unsaved");
});

test("deleting a row offers Undo, which brings the draft back", async () => {
  const draft = newSceneDraft();
  writeDraft(draft);
  const { dialog } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", {
      name: `Delete unsaved scene ${draft.title}`,
    }),
  );

  expect(readDraft(draft.id)).toBeNull();
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    `Deleted ${draft.title}`,
  );
  const undo = screen.getByRole("button", {
    name: `Undo deleting ${draft.title}`,
  });
  expect(undo).toHaveFocus();

  await user.click(undo);

  expect(readDraft(draft.id)).toEqual(draft);
  expect(screen.getByRole("button", { name: draft.title })).toHaveFocus();
});

test("once Undo times out, the draft stays deleted and focus moves to the next row", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const timedUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const first = newSceneDraft(Date.now() - 1000);
  const second = newSceneDraft(Date.now() - 2000);
  writeDraft(first);
  writeDraft(second);
  await openUnsaved();

  await timedUser.click(
    await screen.findByRole("button", {
      name: `Delete unsaved scene ${first.title}`,
    }),
  );
  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(screen.queryByRole("button", { name: /^Undo/ })).toBeNull();
  expect(readDraft(first.id)).toBeNull();
  expect(screen.getByRole("button", { name: second.title })).toHaveFocus();
});
