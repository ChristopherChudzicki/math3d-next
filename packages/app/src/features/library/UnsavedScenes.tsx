import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import classNames from "classnames";
import { Icon } from "@iconify/react/offline";
import trash2 from "@iconify-icons/lucide/trash-2";
import { MathItemType } from "@math3d/mathitem-configs";
import { Drawer } from "@/ui/Drawer";
import IconButton from "@/ui/IconButton";
import { TextButton } from "@/ui/TextLink";
import { u } from "@/util/styles";
import { useAppSelector } from "@/store/hooks";
import useDrafts from "@/store/scene/drafts/useDrafts";
import { writeDraft, removeDraft } from "@/store/scene/drafts/storage";
import type { DraftRecord } from "@/store/scene/drafts/storage";
import { MAIN_FOLDER } from "@/store/scene/state/util";
import useOpenDraft from "./useOpenDraft";
import { cardTitle } from "./constants";
import listStyles from "./ScenesList.module.css";
import styles from "./UnsavedScenes.module.css";

/** How long a deleted row offers Undo. */
const UNDO_MS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

const locale = navigator.languages[0];
const timeFormat = new Intl.DateTimeFormat(locale, {
  hour: "numeric",
  minute: "2-digit",
});
const dateFormat = new Intl.DateTimeFormat(locale, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

/** "3:42 pm": ICU separates "PM" with a narrow no-break space. */
const formatTime = (date: Date) =>
  timeFormat
    .formatToParts(date)
    .map(({ type, value }) => {
      if (type === "dayPeriod") return value.toLowerCase();
      if (type === "literal") return value.replace(/\s/g, " ");
      return value;
    })
    .join("");

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** "Today 3:42 pm", "Yesterday 3:42 pm", else "Mon, Nov 17". */
const formatWhen = (ms: number, now = new Date()) => {
  const date = new Date(ms);
  // Rounded, since a day with a DST change isn't 24 hours.
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (daysAgo === 0) return `Today ${formatTime(date)}`;
  if (daysAgo === 1) return `Yesterday ${formatTime(date)}`;
  return dateFormat.format(date);
};

/** Items under `main` that aren't folders. */
const objectCount = ({ items, itemOrder }: DraftRecord) => {
  const types = new Map(items.map((item) => [item.id, item.type]));
  const seen = new Set<string>();
  const count = (folderId: string): number =>
    (itemOrder[folderId] ?? []).reduce((n, id) => {
      if (types.get(id) !== MathItemType.Folder) return n + 1;
      if (seen.has(id)) return n;
      seen.add(id);
      return n + count(id);
    }, 0);
  const n = count(MAIN_FOLDER);
  return n === 1 ? "1 object" : `${n} objects`;
};

const rowTitle = (record: DraftRecord) =>
  record.key
    ? `Changes to ${cardTitle(record.title)}`
    : cardTitle(record.title);

const deleteLabel = (record: DraftRecord) =>
  record.key
    ? `Delete unsaved changes to ${cardTitle(record.title)}`
    : `Delete unsaved scene ${cardTitle(record.title)}`;

/** This browser's drafts, newest first, except the editor's own session. */
const useOtherDrafts = (): DraftRecord[] => {
  const drafts = useDrafts();
  const currentId = useAppSelector((state) => state.scene.draftId);
  return drafts.filter((draft) => draft.id !== currentId);
};

const UnsavedScenes: React.FC = () => {
  const drafts = useOtherDrafts();
  const openDraft = useOpenDraft();
  const idPrefix = useId();
  const openId = (id: string) => `${idPrefix}-open-${id}`;
  const metaId = (id: string) => `${idPrefix}-meta-${id}`;
  const undoId = (id: string) => `${idPrefix}-undo-${id}`;

  /** Deleted drafts still offering Undo, by id; each has its own timer. */
  const [deleted, setDeleted] = useState<Record<string, DraftRecord>>({});
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  // Keyed per message, so a repeated message is still announced.
  const [status, setStatus] = useState({ text: "", id: 0 });
  const announce = (text: string) =>
    setStatus((prev) => ({ text, id: prev.id + 1 }));

  // Rows come and go with a state change, so focus moves after the commit.
  const focusNext = useRef<(() => HTMLElement | null) | null>(null);
  useLayoutEffect(() => {
    const target = focusNext.current;
    focusNext.current = null;
    target?.()?.focus();
  });

  const listRef = useRef<HTMLUListElement>(null);

  const forget = (id: string) => {
    setDeleted(({ [id]: _, ...rest }) => rest);
    timers.current.delete(id);
  };

  const expire = (record: DraftRecord) => {
    const undo = document.getElementById(undoId(record.id));
    if (undo && document.activeElement === undo) {
      const row = undo.closest("li");
      const neighbor = (row?.nextElementSibling ??
        row?.previousElementSibling) as HTMLElement | null;
      // With no rows left, the list becomes the empty state.
      const panel = listRef.current?.closest<HTMLElement>('[role="tabpanel"]');
      focusNext.current = () =>
        neighbor?.querySelector<HTMLElement>("button") ?? panel ?? null;
    }
    forget(record.id);
  };

  const remove = (record: DraftRecord) => {
    removeDraft(record.id);
    setDeleted((prev) => ({ ...prev, [record.id]: record }));
    timers.current.set(
      record.id,
      setTimeout(() => expire(record), UNDO_MS),
    );
    focusNext.current = () => document.getElementById(undoId(record.id));
    announce(`Deleted ${rowTitle(record)}`);
  };

  const undo = (record: DraftRecord) => {
    clearTimeout(timers.current.get(record.id));
    writeDraft(record);
    forget(record.id);
    focusNext.current = () => document.getElementById(openId(record.id));
  };

  const rows = [
    ...drafts.filter((draft) => !deleted[draft.id]),
    ...Object.values(deleted),
  ].sort((a, b) => b.updatedAt - a.updatedAt);
  const now = new Date();

  return (
    <Drawer.Body>
      {rows.length === 0 ? (
        <div className={listStyles.message}>
          <p className={listStyles.hint}>
            Scenes you edit but don’t save appear here for 7 days.
          </p>
        </div>
      ) : (
        <>
          <p className={classNames(listStyles.hint, styles.intro)}>
            Unsaved work from this browser, kept for 7 days.
          </p>
          <ul role="list" className={styles.list} ref={listRef}>
            {rows.map((record) =>
              deleted[record.id] ? (
                <li
                  key={record.id}
                  className={classNames(styles.row, styles.deleted)}
                >
                  <p className={styles.deletedText}>
                    Deleted ·{" "}
                    <TextButton
                      id={undoId(record.id)}
                      className={styles.undo}
                      aria-label={`Undo deleting ${rowTitle(record)}`}
                      onClick={() => undo(record)}
                    >
                      Undo
                    </TextButton>
                  </p>
                </li>
              ) : (
                <li key={record.id} className={styles.row}>
                  <div className={styles.text}>
                    <button
                      type="button"
                      id={openId(record.id)}
                      className={styles.open}
                      aria-describedby={metaId(record.id)}
                      onClick={() => openDraft(record)}
                    >
                      {rowTitle(record)}
                    </button>
                    <p id={metaId(record.id)} className={styles.meta}>
                      <time dateTime={new Date(record.updatedAt).toISOString()}>
                        {formatWhen(record.updatedAt, now)}
                      </time>
                      {" · "}
                      {objectCount(record)}
                    </p>
                  </div>
                  <IconButton
                    className={styles.delete}
                    label={deleteLabel(record)}
                    aria-describedby={metaId(record.id)}
                    onClick={() => remove(record)}
                  >
                    <Icon icon={trash2} aria-hidden="true" />
                  </IconButton>
                </li>
              ),
            )}
          </ul>
        </>
      )}
      <div role="status" aria-live="polite" className={u.visuallyHidden}>
        <span key={status.id}>{status.text}</span>
      </div>
    </Drawer.Body>
  );
};

export default UnsavedScenes;
export { useOtherDrafts };
