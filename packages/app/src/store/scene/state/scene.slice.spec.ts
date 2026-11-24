import { expect, test } from "vitest";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { makeItem, seedDb } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { sceneFingerprint } from "@/store/scene/drafts/fingerprint";
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
      loadCount: edited.loadCount,
      ...sent(edited),
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
    actions.markSaved({
      key: scene.key,
      author: null,
      revision,
      loadCount,
      ...sent(edited),
    }),
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
    actions.markSaved({
      key: scene.key,
      author: null,
      revision,
      loadCount,
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
      loadCount: legacy.loadCount,
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
    actions.markSaved({
      key: saving.key,
      author: 7,
      revision,
      loadCount,
      ...sent(edited),
    }),
  );

  expect(saved).toBe(editedAgain);
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

  test("an opened draft starts dirty, with savedSince and its modifiedDate", () => {
    const state = reducer(
      undefined,
      actions.setScene({
        ...setSceneFrom(seedDb.withSceneFromItems([])).payload,
        dirty: true,
        savedSince: true,
        modifiedDate: MODIFIED,
      }),
    );

    expect(state).toMatchObject({
      dirty: true,
      savedSince: true,
      modifiedDate: MODIFIED,
    });
  });

  test("the baseline is the loaded scene's fingerprint", () => {
    const scene = seedDb.withSceneFromItems([makeItem(MIT.Point)]);

    expect(load(scene).baseline).toBe(
      sceneFingerprint({
        title: scene.title ?? "",
        items: scene.items,
        itemOrder: scene.itemOrder,
      }),
    );
  });

  test("markSaved moves the baseline to what was sent and clears savedSince", () => {
    const scene = seedDb.withSceneFromItems([]);
    const opened = reducer(
      undefined,
      actions.setScene({ ...setSceneFrom(scene).payload, savedSince: true }),
    );
    const edited = reducer(opened, actions.setTitle({ title: "edited" }));
    const typedDuringSave = reducer(
      edited,
      actions.setTitle({ title: "typed during save" }),
    );

    const saved = reducer(
      typedDuringSave,
      actions.markSaved({
        key: scene.key,
        author: null,
        revision: edited.revision,
        loadCount: edited.loadCount,
        ...sent(edited),
      }),
    );

    expect(saved.baseline).toBe(sceneFingerprint(sent(edited).snapshot));
    expect(saved.modifiedDate).toBe(MODIFIED);
    expect(saved.savedSince).toBe(false);
  });
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
