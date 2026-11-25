import type { MathItem } from "@math3d/mathitem-configs";
import { sceneFingerprint } from "./fingerprint";
import type { SceneContent } from "./fingerprint";
import { isRestorable } from "./restorable";

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
  /**
   * `modifiedDate` of the saved version this session (the draft) edits; null
   * for a new scene.
   */
  baseModifiedDate: string | null;
  /** Who was signed in at the latest write; null if nobody was. */
  owner: number | null;
  updatedAt: number;
};

const PREFIX = "math3d:draft:";
const MAX_DRAFTS = 50;
const MAX_DRAFTS_PER_OWNER = 30;
/** A write that still doesn't fit gives up, rather than empty storage. */
const MAX_QUOTA_EVICTIONS = 3;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const storageKey = (id: string) => `${PREFIX}${id}`;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

/** A stored draft, or null if it's unreadable or can't be opened. */
const parse = (raw: string | null): DraftRecord | null => {
  if (raw === null) return null;
  try {
    const record = JSON.parse(raw) as DraftRecord;
    if (
      typeof record?.id !== "string" ||
      typeof record.title !== "string" ||
      typeof record.updatedAt !== "number" ||
      !(record.owner === null || typeof record.owner === "number") ||
      !Array.isArray(record.items) ||
      typeof record.itemOrder !== "object" ||
      record.itemOrder === null ||
      !isRestorable(record)
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

const isQuotaError = (error: unknown) =>
  error instanceof DOMException && error.name === "QuotaExceededError";

/**
 * Writes `record`. A new record first makes room under the caps: 30 drafts
 * per owner, then 50 in all. A full quota evicts up to 3 drafts until the
 * write fits, the owner's oldest first, then the oldest of all.
 */
const writeDraft = (record: DraftRecord, now = Date.now()) => {
  const key = storageKey(record.id);
  const raw = JSON.stringify(record);
  // Read every draft only when room is needed.
  let others: DraftRecord[] | undefined;
  const getOthers = () => {
    others ??= pruneDrafts(now).filter((draft) => draft.id !== record.id);
    return others;
  };
  const own = () => getOthers().filter((draft) => draft.owner === record.owner);
  const evict = (draft: DraftRecord) => {
    removeKey(storageKey(draft.id));
    others = getOthers().filter((other) => other !== draft);
  };

  if (readRaw(key) === null) {
    while (own().length >= MAX_DRAFTS_PER_OWNER) evict(own().at(-1)!);
    while (getOthers().length >= MAX_DRAFTS) evict(getOthers().at(-1)!);
  }
  for (let evictions = 0; ; evictions += 1) {
    try {
      localStorage.setItem(key, raw);
      break;
    } catch (error) {
      const oldest = own().at(-1) ?? getOthers().at(-1);
      if (
        !isQuotaError(error) ||
        !oldest ||
        evictions === MAX_QUOTA_EVICTIONS
      ) {
        break;
      }
      evict(oldest);
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
  MAX_DRAFTS_PER_OWNER,
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
