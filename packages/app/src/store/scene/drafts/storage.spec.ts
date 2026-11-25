import { afterEach, expect, test, vi } from "vitest";
import {
  DRAFT_KEY_PREFIX,
  MAX_AGE_MS,
  MAX_DRAFTS,
  MAX_DRAFTS_PER_OWNER,
  listDrafts,
  pruneDrafts,
  readDraft,
  removeDraft,
  settleDraftAfterSave,
  subscribeDrafts,
  writeDraft,
} from "./storage";
import type { DraftRecord } from "./storage";

const NOW = Date.UTC(2026, 10, 20);

const makeDraft = (
  id: string,
  updatedAt = NOW,
  owner: number | null = null,
): DraftRecord => ({
  id,
  title: `Draft ${id}`,
  items: [],
  itemOrder: { main: [], setup: [] },
  key: null,
  author: null,
  baseModifiedDate: null,
  owner,
  updatedAt,
});

const ids = () => listDrafts(NOW).map((d) => d.id);

afterEach(() => {
  vi.restoreAllMocks();
});

test("lists drafts newest first, skipping expired, unreadable and unopenable ones", () => {
  writeDraft(makeDraft("old", NOW - 2000), NOW);
  writeDraft(makeDraft("new", NOW - 1000), NOW);
  localStorage.setItem(`${DRAFT_KEY_PREFIX}broken`, "{not json");
  localStorage.setItem(
    `${DRAFT_KEY_PREFIX}expired`,
    JSON.stringify(makeDraft("expired", NOW - MAX_AGE_MS - 1)),
  );
  localStorage.setItem(
    `${DRAFT_KEY_PREFIX}no-setup`,
    JSON.stringify({ ...makeDraft("no-setup"), itemOrder: { main: [] } }),
  );

  expect(ids()).toEqual(["new", "old"]);
});

test("pruning removes expired and unreadable drafts", () => {
  localStorage.setItem(`${DRAFT_KEY_PREFIX}broken`, "{not json");
  localStorage.setItem(
    `${DRAFT_KEY_PREFIX}expired`,
    JSON.stringify(makeDraft("expired", NOW - MAX_AGE_MS - 1)),
  );
  writeDraft(makeDraft("kept"), NOW);

  pruneDrafts(NOW);

  expect(localStorage.length).toBe(1);
  expect(readDraft("kept")).not.toBeNull();
});

test("a new draft past its owner's cap evicts that owner's oldest; rewriting one does not", () => {
  writeDraft(makeDraft("other-owner", NOW - 1000, 7), NOW);
  for (let i = 0; i < MAX_DRAFTS_PER_OWNER; i += 1) {
    writeDraft(makeDraft(`d${i}`, NOW - (MAX_DRAFTS_PER_OWNER - i)), NOW);
  }

  writeDraft(makeDraft("d5"), NOW);
  expect(readDraft("d0")).not.toBeNull();

  writeDraft(makeDraft("extra"), NOW);
  expect(readDraft("d0")).toBeNull();
  expect(readDraft("other-owner")).not.toBeNull();
  expect(listDrafts(NOW)).toHaveLength(MAX_DRAFTS_PER_OWNER + 1);
});

test("a new draft past the overall cap evicts the oldest of all", () => {
  for (let i = 0; i < MAX_DRAFTS; i += 1) {
    // Owners of 10 drafts each, so no owner reaches its own cap.
    writeDraft(makeDraft(`d${i}`, NOW - (MAX_DRAFTS - i), i % 5), NOW);
  }

  writeDraft(makeDraft("extra", NOW, 99), NOW);

  expect(listDrafts(NOW)).toHaveLength(MAX_DRAFTS);
  expect(readDraft("d0")).toBeNull();
});

const failNextWrites = (n: number) => {
  const spy = vi.spyOn(Storage.prototype, "setItem");
  for (let i = 0; i < n; i += 1) {
    // Later calls fall through to the real setItem.
    spy.mockImplementationOnce(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
  }
};

test("a full quota evicts the owner's oldest drafts until the write fits", () => {
  writeDraft(makeDraft("someone-elses", NOW - 3000, 7), NOW);
  writeDraft(makeDraft("mine-older", NOW - 2000, 1), NOW);
  writeDraft(makeDraft("mine-newer", NOW - 1000, 1), NOW);
  failNextWrites(2);

  writeDraft(makeDraft("new", NOW, 1), NOW);

  expect(ids()).toEqual(["new", "someone-elses"]);
});

test("a full quota evicts the oldest of all once the owner has nothing left", () => {
  writeDraft(makeDraft("oldest", NOW - 2000, 7), NOW);
  writeDraft(makeDraft("older", NOW - 1000, 8), NOW);
  failNextWrites(1);

  writeDraft(makeDraft("new", NOW, 1), NOW);

  expect(ids()).toEqual(["new", "older"]);
});

test("a write that still doesn't fit gives up after evicting 3 drafts", () => {
  ["a", "b", "c", "d", "e"].forEach((id, i) =>
    writeDraft(makeDraft(id, NOW - 1000 * (5 - i)), NOW),
  );
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("full", "QuotaExceededError");
  });

  writeDraft(makeDraft("too-big"), NOW);

  expect(ids()).toEqual(["e", "d"]);
});

test("a failed write that isn't a full quota evicts nothing", () => {
  writeDraft(makeDraft("kept"), NOW);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });

  writeDraft(makeDraft("new"), NOW);

  expect(ids()).toEqual(["kept"]);
});

test("blocked storage fails silently", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });

  expect(() => writeDraft(makeDraft("a"), NOW)).not.toThrow();
  expect(readDraft("a")).toBeNull();
  expect(listDrafts(NOW)).toEqual([]);
});

test("subscribers hear this tab's writes and removals, and other tabs' changes", () => {
  const listener = vi.fn();
  const unsubscribe = subscribeDrafts(listener);

  writeDraft(makeDraft("a"), NOW);
  removeDraft("a");
  window.dispatchEvent(
    new StorageEvent("storage", { key: `${DRAFT_KEY_PREFIX}b` }),
  );
  window.dispatchEvent(new StorageEvent("storage", { key: "unrelated" }));
  expect(listener).toHaveBeenCalledTimes(3);

  unsubscribe();
  writeDraft(makeDraft("c"), NOW);
  expect(listener).toHaveBeenCalledTimes(3);
});

test("a late save removes the draft only if it holds what was saved", () => {
  const draft = makeDraft("a");
  writeDraft(draft, NOW);

  settleDraftAfterSave("a", { ...draft, title: "something else" });
  expect(readDraft("a")).not.toBeNull();

  settleDraftAfterSave("a", draft);
  expect(readDraft("a")).toBeNull();
});
