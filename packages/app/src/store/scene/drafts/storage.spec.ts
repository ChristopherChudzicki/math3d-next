import { afterEach, expect, test, vi } from "vitest";
import {
  DRAFT_KEY_PREFIX,
  MAX_AGE_MS,
  MAX_DRAFTS,
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

const makeDraft = (id: string, updatedAt = NOW): DraftRecord => ({
  id,
  title: `Draft ${id}`,
  items: [],
  itemOrder: { main: [], setup: [] },
  key: null,
  author: null,
  baseModifiedDate: null,
  createdAt: updatedAt,
  updatedAt,
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

test("lists drafts newest first, skipping expired and unreadable ones", () => {
  writeDraft(makeDraft("old", NOW - 2000), NOW);
  writeDraft(makeDraft("new", NOW - 1000), NOW);
  localStorage.setItem(`${DRAFT_KEY_PREFIX}broken`, "{not json");
  localStorage.setItem(
    `${DRAFT_KEY_PREFIX}expired`,
    JSON.stringify(makeDraft("expired", NOW - MAX_AGE_MS - 1)),
  );

  expect(listDrafts(NOW).map((d) => d.id)).toEqual(["new", "old"]);
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

test("a new draft past the cap evicts the oldest; rewriting one does not", () => {
  for (let i = 0; i < MAX_DRAFTS; i += 1) {
    writeDraft(makeDraft(`d${i}`, NOW - (MAX_DRAFTS - i)), NOW);
  }

  writeDraft(makeDraft("d5", NOW), NOW);
  expect(listDrafts(NOW)).toHaveLength(MAX_DRAFTS);
  expect(readDraft("d0")).not.toBeNull();

  writeDraft(makeDraft("extra", NOW), NOW);
  expect(listDrafts(NOW)).toHaveLength(MAX_DRAFTS);
  expect(readDraft("d0")).toBeNull();
});

test("a full quota evicts the oldest other draft and retries once", () => {
  writeDraft(makeDraft("oldest", NOW - 2000), NOW);
  writeDraft(makeDraft("older", NOW - 1000), NOW);
  // Later calls fall through to the real setItem.
  vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
    throw new DOMException("full", "QuotaExceededError");
  });

  writeDraft(makeDraft("new"), NOW);

  expect(readDraft("new")).not.toBeNull();
  expect(readDraft("oldest")).toBeNull();
  expect(readDraft("older")).not.toBeNull();
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
