import type { MathItem } from "@math3d/mathitem-configs";
import { sceneFingerprint } from "./fingerprint";
import type { SceneContent } from "./fingerprint";

// Unsaved scenes, one `localStorage` entry per editing session. Storage can
// be blocked or full; every access fails silently, since losing a draft beats
// breaking the editor.

type DraftRecord = {
  id: string;
  title: string;
  items: MathItem[];
  itemOrder: Record<string, string[]>;
  /** The saved scene the draft edits; null for a new scene. */
  key: string | null;
  author: number | null;
  /** The saved scene's `modifiedDate` as of the draft's last write. */
  baseModifiedDate: string | null;
  createdAt: number;
  updatedAt: number;
};

const PREFIX = "math3d:draft:";
const MAX_DRAFTS = 30;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const storageKey = (id: string) => `${PREFIX}${id}`;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const parse = (raw: string | null): DraftRecord | null => {
  if (raw === null) return null;
  try {
    const record = JSON.parse(raw) as DraftRecord;
    if (
      typeof record?.id !== "string" ||
      typeof record.title !== "string" ||
      typeof record.updatedAt !== "number" ||
      !Array.isArray(record.items) ||
      typeof record.itemOrder !== "object" ||
      record.itemOrder === null
    ) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
};

const isExpired = (record: DraftRecord, now: number) =>
  now - record.updatedAt > MAX_AGE_MS;

/** Every draft key, parsed or not. */
const draftKeys = (): string[] => {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    return keys;
  } catch {
    return [];
  }
};

const readRaw = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const removeKey = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignored, as is every storage failure here.
  }
};

const readDraft = (id: string): DraftRecord | null =>
  parse(readRaw(storageKey(id)));

const byNewest = (a: DraftRecord, b: DraftRecord) => b.updatedAt - a.updatedAt;

/** Unexpired drafts, newest first. Reads only, so it's safe during render. */
const listDrafts = (now = Date.now()): DraftRecord[] =>
  draftKeys()
    .map((key) => parse(readRaw(key)))
    .filter((record): record is DraftRecord => !!record)
    .filter((record) => !isExpired(record, now))
    .sort(byNewest);

/** Removes expired and unreadable drafts; returns the rest, newest first. */
const pruneDrafts = (now = Date.now()): DraftRecord[] => {
  const kept: DraftRecord[] = [];
  let removed = false;
  draftKeys().forEach((key) => {
    const record = parse(readRaw(key));
    if (!record || isExpired(record, now)) {
      removeKey(key);
      removed = true;
    } else {
      kept.push(record);
    }
  });
  if (removed) notify();
  return kept.sort(byNewest);
};

const removeDraft = (id: string) => {
  removeKey(storageKey(id));
  notify();
};

const writeDraft = (record: DraftRecord, now = Date.now()) => {
  const drafts = pruneDrafts(now);
  const others = drafts.filter((draft) => draft.id !== record.id);
  const isNew = others.length === drafts.length;
  const evictOldest = () => {
    const oldest = others.pop();
    if (oldest) removeKey(storageKey(oldest.id));
    return !!oldest;
  };
  if (isNew && others.length >= MAX_DRAFTS) evictOldest();
  const raw = JSON.stringify(record);
  try {
    localStorage.setItem(storageKey(record.id), raw);
  } catch {
    // Most likely a full quota: make room once, then give up.
    if (evictOldest()) {
      try {
        localStorage.setItem(storageKey(record.id), raw);
      } catch {
        // Ignored, as is every storage failure here.
      }
    }
  }
  notify();
};

/**
 * For a save that lands after its tab loaded another scene: removes that
 * session's draft if it still matches what was sent.
 */
const settleDraftAfterSave = (id: string, snapshot: SceneContent) => {
  const record = readDraft(id);
  if (record && sceneFingerprint(record) === sceneFingerprint(snapshot)) {
    removeDraft(id);
  }
};

/**
 * Calls `listener` when drafts change, in this tab or another. A tab's own
 * writes raise no `storage` event in that tab, hence the local listeners.
 */
const subscribeDrafts = (listener: () => void): (() => void) => {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(PREFIX)) listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

export {
  MAX_AGE_MS,
  MAX_DRAFTS,
  PREFIX as DRAFT_KEY_PREFIX,
  listDrafts,
  pruneDrafts,
  readDraft,
  removeDraft,
  settleDraftAfterSave,
  subscribeDrafts,
  writeDraft,
};
export type { DraftRecord };
