import { expect, test } from "vitest";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { makeItem, seedDb } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { actions, reducer } from "./scene.slice";

const setSceneFrom = (scene: Scene) =>
  actions.setScene({
    key: scene.key,
    author: null,
    items: scene.items,
    order: scene.itemOrder,
    title: scene.title ?? "",
    isLegacy: false,
  });

const load = (scene: Scene) => reducer(undefined, setSceneFrom(scene));

test("markSaved clears dirty when nothing changed since the save began", () => {
  const scene = seedDb.withSceneFromItems([]);
  const edited = reducer(load(scene), actions.setTitle({ title: "edited" }));

  const saved = reducer(
    edited,
    actions.markSaved({
      key: scene.key,
      author: null,
      revision: edited.revision,
      loadCount: edited.loadCount,
    }),
  );

  expect(saved.dirty).toBe(false);
});

test("markSaved leaves dirty set after an edit made during the save", () => {
  const scene = seedDb.withSceneFromItems([]);
  const edited = reducer(load(scene), actions.setTitle({ title: "edited" }));
  const { revision, loadCount } = edited;
  // Already dirty: the counter must still move.
  const typedDuringSave = reducer(
    edited,
    actions.setTitle({ title: "typed during save" }),
  );

  const saved = reducer(
    typedDuringSave,
    actions.markSaved({ key: scene.key, author: null, revision, loadCount }),
  );

  expect(saved.dirty).toBe(true);
});

test("clean actions, like an animating slider's, do not count as edits", () => {
  const item = makeItem(MIT.Point);
  const scene = seedDb.withSceneFromItems([item]);
  const edited = reducer(load(scene), actions.setTitle({ title: "edited" }));
  const { revision, loadCount } = edited;
  const animated = reducer(
    edited,
    actions.setProperties(
      { id: item.id, type: item.type, properties: { description: "tick" } },
      true,
    ),
  );

  const saved = reducer(
    animated,
    actions.markSaved({ key: scene.key, author: null, revision, loadCount }),
  );

  expect(saved.dirty).toBe(false);
});

test("markSaved adopts the published key, author, title, and legacy flag", () => {
  const legacy = reducer(
    undefined,
    actions.setScene({
      ...setSceneFrom(seedDb.withSceneFromItems([])).payload,
      isLegacy: true,
    }),
  );

  const saved = reducer(
    legacy,
    actions.markSaved({
      key: "new-key",
      author: 7,
      title: "Published",
      isLegacy: false,
      revision: legacy.revision,
      loadCount: legacy.loadCount,
    }),
  );

  expect(saved).toMatchObject({
    key: "new-key",
    author: 7,
    title: "Published",
    isLegacy: false,
    loaded: true,
  });
});

test("markSaved does nothing once another scene has loaded", () => {
  const saving = seedDb.withSceneFromItems([]);
  const opened = seedDb.withSceneFromItems([]);
  const edited = reducer(load(saving), actions.setTitle({ title: "edited" }));
  const { revision, loadCount } = edited;
  const openedDuringSave = reducer(edited, setSceneFrom(opened));
  const editedAgain = reducer(
    openedDuringSave,
    actions.setTitle({ title: "edited too" }),
  );

  const saved = reducer(
    editedAgain,
    actions.markSaved({ key: saving.key, author: 7, revision, loadCount }),
  );

  expect(saved).toBe(editedAgain);
});

test("loading a scene clears dirty", () => {
  const first = seedDb.withSceneFromItems([]);
  const second = seedDb.withSceneFromItems([]);
  const edited = reducer(load(first), actions.setTitle({ title: "edited" }));

  expect(reducer(edited, setSceneFrom(second)).dirty).toBe(false);
});
