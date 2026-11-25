import { afterEach, expect, test, vi } from "vitest";
import { nanoid } from "@reduxjs/toolkit";
import { delay, http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { makeItem, seedDb, urls } from "@math3d/mock-api";
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
  owner: null,
  updatedAt,
});

const newSceneDraft = (updatedAt?: number): DraftRecord => ({
  ...draftOf(seedDb.withSceneFromItems([makeItem(MIT.Point)]), updatedAt),
  key: null,
  author: null,
  baseModifiedDate: null,
});

const openUnsaved = async (options?: Parameters<typeof renderTestApp>[1]) => {
  const view = renderTestApp("/?overlay=scenes&list=unsaved", options);
  const dialog = await screen.findByRole("dialog", { name: "Scenes" });
  return { ...view, dialog };
};

const rowNames = () =>
  within(screen.getByRole("list"))
    .getAllByRole("button", { name: /^(?!Delete)/ })
    .map((button) => button.textContent);

/** Holds scene GETs until the returned `release` is called. */
const holdSceneFetch = () => {
  const gate = Promise.withResolvers<void>();
  // Returning nothing falls through to the mock API's handler.
  server.use(
    http.get(urls.scenes.detail, async () => {
      await gate.promise;
    }),
  );
  return gate.resolve;
};

afterEach(() => {
  vi.useRealTimers();
});

test("rows are newest first, and this tab's own session is marked current", async () => {
  const older = newSceneDraft(Date.now() - 2000);
  const newer = newSceneDraft(Date.now() - 1000);
  writeDraft(older);
  writeDraft(newer);
  const { store } = await openUnsaved();
  await screen.findByRole("button", { name: newer.title });

  const own = { ...newSceneDraft(), id: store.getState().scene.draftId };
  act(() => writeDraft(own));

  expect(rowNames()).toEqual([own.title, newer.title, older.title]);
  const ownRow = screen.getByRole("button", { name: own.title });
  expect(ownRow).toHaveAttribute("aria-current", "true");
  expect(ownRow).toHaveAttribute("aria-disabled", "true");
  expect(
    screen.queryByRole("button", { name: `Delete unsaved scene ${own.title}` }),
  ).toBeNull();
  expect(screen.getByRole("tab", { name: "Unsaved (3)" })).toBeVisible();

  await user.click(screen.getByRole("button", { name: own.title }));

  expect(store.getState().scene.draftId).toBe(own.id);
  expect(readDraft(own.id)).toEqual(own);
});

test("behind \"Scene not found\", the editor's session isn't current and can be reopened", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { store, router, location } = renderTestApp(`/${scene.key}`);
  await waitFor(() => expect(store.getState().scene.key).toBe(scene.key));
  const own = { ...draftOf(scene), id: store.getState().scene.draftId };
  writeDraft(own);

  await act(() => router.navigate("/missing?overlay=scenes&list=unsaved"));
  await expectToast("This scene doesn’t exist.");
  const row = await screen.findByRole("button", {
    name: `Changes to ${own.title}`,
  });
  expect(row).not.toHaveAttribute("aria-current");
  await user.click(row);

  await waitFor(() => expect(location.current.pathname).toBe(`/${scene.key}`));
  expect(store.getState().scene.draftId).not.toBe(own.id);
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
    "Tue 9:05 am · 0 objects",
  );
});

test("with no drafts, the tab explains what will appear", async () => {
  await openUnsaved();

  expect(
    await screen.findByText(
      "Changes you don’t save are kept here, in this browser, for up to 7 days.",
    ),
  ).toBeVisible();
  expect(screen.getByRole("tab", { name: "Unsaved" })).toBeVisible();
});

test("while sign-in status is unknown, the tab lists nothing and doesn't say it's empty", async () => {
  server.use(http.get(urls.auth.me, () => delay("infinite")));
  writeDraft(newSceneDraft());
  const { dialog } = await openUnsaved();

  expect(within(dialog).getByRole("tab", { name: "Unsaved" })).toBeVisible();
  expect(within(dialog).queryByRole("list")).toBeNull();
  expect(within(dialog).queryByText(/Changes you don’t save/)).toBeNull();
});

test("with drafts, the tab says where they come from", async () => {
  writeDraft(newSceneDraft());
  await openUnsaved();

  expect(
    await screen.findByText(
      "Unsaved work from this browser, kept for up to 7 days.",
    ),
  ).toBeVisible();
});

test("a signed-in user sees drafts written while signed out and their own, not another user's", async () => {
  const me = seedDb.withUser();
  const signedOut = newSceneDraft();
  const mine = { ...newSceneDraft(), owner: me.id };
  const theirs = { ...newSceneDraft(), owner: seedDb.withUser().id };
  [signedOut, mine, theirs].forEach((draft) => writeDraft(draft));
  await openUnsaved({ user: me });

  await screen.findByRole("button", { name: mine.title });
  expect(rowNames().sort()).toEqual([signedOut.title, mine.title].sort());
});

test("signed out, a user's drafts aren't listed", async () => {
  const signedOut = newSceneDraft();
  writeDraft(signedOut);
  writeDraft({ ...newSceneDraft(), owner: seedDb.withUser().id });
  await openUnsaved();

  await screen.findByRole("button", { name: signedOut.title });
  expect(rowNames()).toEqual([signedOut.title]);
});

test("opening a draft loads it as unsaved work at its scene's URL, under a new id, with the list still open", async () => {
  const scene = seedDb.withSceneFromItems([makeItem(MIT.Point)]);
  const draft = { ...draftOf(scene), title: "Edited title" };
  writeDraft(draft);
  const { store, location, dialog } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );

  await waitFor(() => expect(location.current.pathname).toBe(`/${scene.key}`));
  expect(location.current.search).toBe("?overlay=scenes&list=unsaved");
  const state = store.getState().scene;
  expect(state).toMatchObject({
    key: scene.key,
    title: draft.title,
    dirty: true,
  });
  const [copy] = listDrafts();
  expect(listDrafts()).toHaveLength(1);
  expect(copy.id).toBe(state.draftId);
  expect(copy.id).not.toBe(draft.id);
  expect(dialog).toBeVisible();
  const row = screen.getByRole("button", { name: `Changes to ${draft.title}` });
  expect(row).toHaveFocus();
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    `Opened unsaved changes to ${draft.title}`,
  );
});

test("clicking through drafts keeps their order, and the one you left stays listed, no longer current", async () => {
  const saved = draftOf(seedDb.withSceneFromItems([]), Date.now() - 1000);
  const untitled = newSceneDraft(Date.now() - 2000);
  writeDraft(saved);
  writeDraft(untitled);
  const { store, location } = await openUnsaved();
  const names = [`Changes to ${saved.title}`, untitled.title];

  await user.click(await screen.findByRole("button", { name: names[0] }));
  await waitFor(() => expect(location.current.pathname).toBe(`/${saved.key}`));
  await waitFor(() => {
    const row = screen.getByRole("button", { name: names[0] });
    expect(row).toHaveAttribute("aria-current", "true");
  });
  await user.click(screen.getByRole("button", { name: names[1] }));
  await waitFor(() => expect(store.getState().scene.key).toBeNull());

  expect(location.current.pathname).toBe("/");
  expect(rowNames()).toEqual(names);
  expect(screen.getByRole("button", { name: names[0] })).not.toHaveAttribute(
    "aria-current",
  );
  expect(screen.getByRole("button", { name: names[1] })).toHaveAttribute(
    "aria-current",
    "true",
  );
});

test("a draft written by another tab while it opens opens as written", async () => {
  const release = holdSceneFetch();
  const draft = draftOf(seedDb.withSceneFromItems([]));
  writeDraft(draft);
  const { store, queryClient } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );
  act(() => writeDraft({ ...draft, title: "Edited in another tab" }));
  release();
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));

  expect(store.getState().scene.title).toBe("Edited in another tab");
  expect(listDrafts().map((d) => d.title)).toEqual(["Edited in another tab"]);
});

test("a draft of a legacy scene opens as legacy", async () => {
  const scene = seedDb.withSceneFromItems([], { isLegacy: true });
  const draft = draftOf(scene);
  writeDraft(draft);
  const { store, location } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );

  await waitFor(() => expect(location.current.pathname).toBe(`/${scene.key}`));
  expect(store.getState().scene.isLegacy).toBe(true);
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
  const entry = location.current.key;

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );

  await waitFor(() => expect(store.getState().scene.title).toBe(draft.title));
  // Already at "/", so no history entry is added.
  expect(location.current.key).toBe(entry);
  expect(store.getState().scene).toMatchObject({
    key: null,
    author: null,
    title: draft.title,
  });
});

test("a draft whose scene can't be checked opens at its scene's URL", async () => {
  server.use(http.get(urls.scenes.detail, () => HttpResponse.error()));
  const scene = seedDb.withSceneFromItems([]);
  const draft = draftOf(scene);
  writeDraft(draft);
  const { store, location } = await openUnsaved();

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );

  await waitFor(() => expect(location.current.pathname).toBe(`/${scene.key}`));
  expect(store.getState().scene.key).toBe(scene.key);
});

test("a draft says it's opening while its scene is checked, and opens once however often it's clicked", async () => {
  const release = holdSceneFetch();
  const scene = seedDb.withSceneFromItems([]);
  const draft = draftOf(scene);
  writeDraft(draft);
  const { location } = await openUnsaved();
  const row = await screen.findByRole("button", {
    name: `Changes to ${draft.title}`,
  });

  await user.click(row);
  await user.click(row);

  expect(row).toHaveAccessibleDescription("Opening…");
  release();
  await waitFor(() => expect(location.current.pathname).toBe(`/${scene.key}`));
  expect(listDrafts()).toHaveLength(1);
});

test("closing the list while a draft's scene is checked leaves the editor as it was", async () => {
  const release = holdSceneFetch();
  const draft = draftOf(seedDb.withSceneFromItems([]));
  writeDraft(draft);
  const { store, location, dialog, queryClient } = await openUnsaved();
  const before = store.getState().scene.draftId;

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );
  await user.keyboard("{Escape}");
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  expect(queryClient.isFetching()).toBe(1);
  release();
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));

  expect(store.getState().scene.draftId).toBe(before);
  expect(location.current.pathname).toBe("/");
  expect(readDraft(draft.id)).not.toBeNull();
});

test("switching tabs while a draft's scene is checked leaves the editor as it was", async () => {
  const release = holdSceneFetch();
  const draft = draftOf(seedDb.withSceneFromItems([]));
  writeDraft(draft);
  const { store, queryClient } = await openUnsaved();
  const before = store.getState().scene.draftId;

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );
  await user.click(screen.getByRole("tab", { name: "Examples" }));
  release();
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));

  expect(store.getState().scene.draftId).toBe(before);
  expect(screen.getByRole("tab", { name: "Examples" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(readDraft(draft.id)).not.toBeNull();
});

test("deleting a draft while it opens leaves it deleted, and the editor as it was", async () => {
  const release = holdSceneFetch();
  const draft = draftOf(seedDb.withSceneFromItems([]));
  writeDraft(draft);
  const { store, queryClient } = await openUnsaved();
  const before = store.getState().scene.draftId;

  await user.click(
    await screen.findByRole("button", { name: `Changes to ${draft.title}` }),
  );
  await user.click(
    screen.getByRole("button", {
      name: `Delete unsaved changes to ${draft.title}`,
    }),
  );
  release();
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));

  expect(store.getState().scene.draftId).toBe(before);
  expect(listDrafts()).toEqual([]);
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
  expect(within(dialog).getByRole("listitem")).toHaveTextContent(
    `Deleted “${draft.title}” · Undo`,
  );
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    `Deleted unsaved scene ${draft.title}`,
  );
  const undo = screen.getByRole("button", {
    name: `Undo deleting unsaved scene ${draft.title}`,
  });
  expect(undo).toHaveFocus();
  // Undo is focusable, so the panel isn't a tab stop.
  expect(within(dialog).getByRole("tabpanel")).toHaveAttribute(
    "tabindex",
    "-1",
  );

  await user.click(undo);

  expect(readDraft(draft.id)).toEqual(draft);
  expect(screen.getByRole("button", { name: draft.title })).toHaveFocus();
});

test("Undo doesn't time out", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const draft = newSceneDraft();
  writeDraft(draft);
  await openUnsaved();

  await user.click(
    await screen.findByRole("button", {
      name: `Delete unsaved scene ${draft.title}`,
    }),
  );
  act(() => {
    vi.advanceTimersByTime(60_000);
  });

  expect(
    screen.getByRole("button", {
      name: `Undo deleting unsaved scene ${draft.title}`,
    }),
  ).toBeVisible();
});

test("Undo keeps a newer write of the draft from another tab", async () => {
  const draft = newSceneDraft(Date.now() - 1000);
  writeDraft(draft);
  await openUnsaved();
  await user.click(
    await screen.findByRole("button", {
      name: `Delete unsaved scene ${draft.title}`,
    }),
  );
  const newer = {
    ...draft,
    title: "Edited in another tab",
    updatedAt: Date.now(),
  };
  act(() => writeDraft(newer));

  await user.click(
    screen.getByRole("button", {
      name: `Undo deleting unsaved scene ${draft.title}`,
    }),
  );

  expect(readDraft(draft.id)).toEqual(newer);
});
