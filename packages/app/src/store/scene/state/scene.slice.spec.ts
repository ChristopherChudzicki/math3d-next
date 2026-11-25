import { expect, test } from "vitest";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { makeItem, seedDb } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { actions, reducer } from "./scene.slice";
import type { SceneState } from "./scene.slice";

const MODIFIED = "2026-11-20T12:00:00.000Z";

/** What a save of `state` sends, and the date its response carries. */
const sent = (state: SceneState) => ({
  snapshot: {
    title: state.title,
    items: Object.values(state.items),
    itemOrder: state.order,
  },
  modifiedDate: MODIFIED,
});

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
      ...sent(edited),
    }),
  );

  expect(saved.dirty).toBe(false);
});

test("markSaved leaves dirty set after an edit made during the save", () => {
  const scene = seedDb.withSceneFromItems([]);
  const edited = reducer(load(scene), actions.setTitle({ title: "edited" }));
  const { revision } = edited;
  // Already dirty: the counter must still move.
  const typedDuringSave = reducer(
    edited,
    actions.setTitle({ title: "typed during save" }),
  );

  const saved = reducer(
    typedDuringSave,
    actions.markSaved({
      key: scene.key,
      author: null,
      revision,
      ...sent(edited),
    }),
  );

  expect(saved.dirty).toBe(true);
});

test("clean actions, like an animating slider's, do not count as edits", () => {
  const item = makeItem(MIT.Point);
  const scene = seedDb.withSceneFromItems([item]);
  const edited = reducer(load(scene), actions.setTitle({ title: "edited" }));
  const { revision } = edited;
  const animated = reducer(
    edited,
    actions.setProperties(
      { id: item.id, type: item.type, properties: { description: "tick" } },
      true,
    ),
  );

  const saved = reducer(
    animated,
    actions.markSaved({
      key: scene.key,
      author: null,
      revision,
      ...sent(edited),
    }),
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
      ...sent(legacy),
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

test("loading a scene clears dirty", () => {
  const first = seedDb.withSceneFromItems([]);
  const second = seedDb.withSceneFromItems([]);
  const edited = reducer(load(first), actions.setTitle({ title: "edited" }));

  expect(reducer(edited, setSceneFrom(second)).dirty).toBe(false);
});

describe("draft session", () => {
  test("each load starts a session with its own draft id", () => {
    const scene = seedDb.withSceneFromItems([]);
    const first = load(scene);
    const second = reducer(first, setSceneFrom(scene));

    expect(second.draftId).not.toBe(first.draftId);
  });

  test("markSaved records the saved version's modifiedDate", () => {
    const edited = reducer(
      load(seedDb.withSceneFromItems([])),
      actions.setTitle({ title: "edited" }),
    );

    const saved = reducer(
      edited,
      actions.markSaved({
        key: edited.key ?? "",
        author: null,
        revision: edited.revision,
        ...sent(edited),
      }),
    );

    expect(saved.modifiedDate).toBe(MODIFIED);
  });
});

test("removing a folder removes its entry in the order", () => {
  const scene = seedDb.withSceneFromItems([]);
  const [folderId] = scene.itemOrder.main;
  const loaded = load(scene);
  expect(loaded.order[folderId]).toEqual([]);

  const removed = reducer(loaded, actions.remove({ id: folderId }));

  expect(removed.order).not.toHaveProperty(folderId);
});

describe("calculated visibility", () => {
  const loadPoint = (properties: {
    calculatedVisibility: string;
    useCalculatedVisibility: boolean;
  }) => {
    const point = makeItem(MIT.Point, properties);
    return { point, state: load(seedDb.withSceneFromItems([point])) };
  };
  const setText = (id: string, calculatedVisibility: string) =>
    actions.setProperties({
      id,
      type: MIT.Point,
      properties: { calculatedVisibility },
    });

  test.each([
    { text: "b", following: true },
    { text: " ", following: false },
  ])(
    "editing the expression to '$text' sets useCalculatedVisibility $following",
    ({ text, following }) => {
      const { point, state } = loadPoint({
        calculatedVisibility: "a",
        useCalculatedVisibility: !following,
      });
      const next = reducer(state, setText(point.id, text));
      expect(next.items[point.id].properties).toMatchObject({
        useCalculatedVisibility: following,
      });
    },
  );

  test("re-sending the same expression leaves it manual", () => {
    const { point, state } = loadPoint({
      calculatedVisibility: "a",
      useCalculatedVisibility: false,
    });
    const next = reducer(state, setText(point.id, "a"));
    expect(next.items[point.id].properties).toMatchObject({
      useCalculatedVisibility: false,
    });
  });

  test("followCalculatedVisibility skips blank expressions and missing items", () => {
    const { point, state } = loadPoint({
      calculatedVisibility: "",
      useCalculatedVisibility: false,
    });
    const next = reducer(
      state,
      actions.followCalculatedVisibility({ ids: [point.id, "missing"] }),
    );
    expect(next.items[point.id].properties).toMatchObject({
      useCalculatedVisibility: false,
    });
  });
});
