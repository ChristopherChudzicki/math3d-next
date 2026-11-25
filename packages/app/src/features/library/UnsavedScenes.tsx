import React, { useId, useLayoutEffect, useRef, useState } from "react";
import classNames from "classnames";
import { Icon } from "@iconify/react/offline";
import trash2 from "@iconify-icons/lucide/trash-2";
import { MathItemType } from "@math3d/mathitem-configs";
import { Drawer } from "@/ui/Drawer";
import { Tabs } from "@/ui/Tabs";
import IconButton from "@/ui/IconButton";
import { TextButton } from "@/ui/TextLink";
import { u } from "@/util/styles";
import { useAppSelector } from "@/store/hooks";
import {
  readDraft,
  removeDraft,
  writeDraft,
} from "@/store/scene/drafts/storage";
import type { DraftRecord } from "@/store/scene/drafts/storage";
import { MAIN_FOLDER } from "@/store/scene/state/util";
import useDrafts from "./useDrafts";
import useOpenDraft from "./useOpenDraft";
import { ListType, cardTitle } from "./constants";
import listStyles from "./ScenesList.module.css";
import styles from "./UnsavedScenes.module.css";

const DAY_MS = 24 * 60 * 60 * 1000;

const locale = navigator.languages[0];
const timeFormat = new Intl.DateTimeFormat(locale, {
  hour: "numeric",
  minute: "2-digit",
});
const weekdayFormat = new Intl.DateTimeFormat(locale, { weekday: "short" });

/** "3:42 pm": lowercase, with a plain space (ICU puts a narrow no-break space before "PM"). */
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

/**
 * "Today 3:42 pm", "Yesterday 3:42 pm", else "Mon 3:42 pm": drafts last a
 * week, so the weekday is unambiguous.
 */
const formatWhen = (ms: number, now = new Date()) => {
  const date = new Date(ms);
  // Rounded, since a day with a DST change isn't 24 hours.
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  const day =
    { 0: "Today", 1: "Yesterday" }[daysAgo] ?? weekdayFormat.format(date);
  return `${day} ${formatTime(date)}`;
};

/** Items under `main` that aren't folders; folders hold no folders. */
const objectCount = ({ items, itemOrder }: DraftRecord) => {
  const folders = new Set(
    items
      .filter((item) => item.type === MathItemType.Folder)
      .map((item) => item.id),
  );
  const n = itemOrder[MAIN_FOLDER].reduce(
    (sum, id) => sum + (folders.has(id) ? itemOrder[id]?.length ?? 0 : 1),
    0,
  );
  return n === 1 ? "1 object" : `${n} objects`;
};

const rowTitle = (record: DraftRecord) =>
  record.key
    ? `Changes to ${cardTitle(record.title)}`
    : cardTitle(record.title);

/** The row's name inside a sentence: "Deleted unsaved changes to Torus". */
const unsavedName = (record: DraftRecord) =>
  record.key
    ? `unsaved changes to ${cardTitle(record.title)}`
    : `unsaved scene ${cardTitle(record.title)}`;

const DraftRow: React.FC<{
  record: DraftRecord;
  /** The editor's own session, which the row neither opens nor deletes. */
  current: boolean;
  opening: boolean;
  now: Date;
  openId: string;
  metaId: string;
  onOpen: () => void;
  onDelete: () => void;
}> = ({ record, current, opening, now, openId, metaId, onOpen, onDelete }) => (
  <li className={classNames(styles.row, current && styles.current)}>
    <div className={styles.text}>
      <button
        type="button"
        id={openId}
        className={styles.open}
        aria-current={current || undefined}
        aria-describedby={metaId}
        aria-busy={opening}
        onClick={current ? undefined : onOpen}
      >
        {rowTitle(record)}
      </button>
      <p id={metaId} className={styles.meta}>
        {opening ? (
          "Opening…"
        ) : (
          <>
            <time dateTime={new Date(record.updatedAt).toISOString()}>
              {formatWhen(record.updatedAt, now)}
            </time>
            {" · "}
            {objectCount(record)}
          </>
        )}
      </p>
    </div>
    {current ? (
      // No Delete: the editor would rewrite this draft on its next edit.
      // aria-current on the button already says "current" to screen readers.
      <span className={styles.currentBadge} aria-hidden="true">
        Current
      </span>
    ) : (
      <IconButton
        className={styles.delete}
        label={`Delete ${unsavedName(record)}`}
        aria-describedby={metaId}
        onClick={onDelete}
      >
        <Icon icon={trash2} aria-hidden="true" />
      </IconButton>
    )}
  </li>
);

/** Offers Undo until the list goes away: the drawer closes or the tab changes. */
const DeletedRow: React.FC<{
  record: DraftRecord;
  undoId: string;
  onUndo: () => void;
}> = ({ record, undoId, onUndo }) => (
  <li className={classNames(styles.row, styles.deleted)}>
    <p className={styles.deletedText}>
      Deleted “{rowTitle(record)}” ·{" "}
      <TextButton
        id={undoId}
        className={styles.undo}
        aria-label={`Undo deleting ${unsavedName(record)}`}
        onClick={onUndo}
      >
        Undo
      </TextButton>
    </p>
  </li>
);

/** The Unsaved tab's panel. */
const UnsavedScenes: React.FC<{ className?: string }> = ({ className }) => {
  const drafts = useDrafts();
  const currentId = useAppSelector((state) => state.scene.draftId);
  const { openDraft, openingId } = useOpenDraft();
  const idPrefix = useId();
  const openId = (id: string) => `${idPrefix}-open-${id}`;
  const metaId = (id: string) => `${idPrefix}-meta-${id}`;
  const undoId = (id: string) => `${idPrefix}-undo-${id}`;

  /** Deleted drafts still offering Undo, by id. */
  const [deleted, setDeleted] = useState<Record<string, DraftRecord>>({});

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

  const forget = (id: string) => setDeleted(({ [id]: _, ...rest }) => rest);

  const remove = (record: DraftRecord) => {
    removeDraft(record.id);
    setDeleted((prev) => ({ ...prev, [record.id]: record }));
    focusNext.current = () => document.getElementById(undoId(record.id));
    announce(`Deleted ${unsavedName(record)}`);
  };

  const open = async (record: DraftRecord) => {
    const copy = await openDraft(record);
    if (!copy) return;
    // Opening re-keys the row, so focus follows it to its new id.
    focusNext.current = () => document.getElementById(openId(copy.id));
    announce(`Opened ${unsavedName(copy)}`);
  };

  const undo = (record: DraftRecord) => {
    // Another tab still editing that session may have written it since.
    if (!readDraft(record.id)) writeDraft(record);
    forget(record.id);
    focusNext.current = () => document.getElementById(openId(record.id));
  };

  const rows = [
    ...(drafts ?? []).filter((draft) => !deleted[draft.id]),
    ...Object.values(deleted),
  ].sort((a, b) => b.updatedAt - a.updatedAt);
  const now = new Date();

  return (
    // Base UI makes panels tab stops, which APG reserves for panels whose
    // content isn't focusable: here, only the empty state.
    <Tabs.Panel
      value={ListType.Unsaved}
      className={className}
      tabIndex={rows.length > 0 ? -1 : 0}
    >
      <Drawer.Body>
        {/* Until sign-in status is known, which drafts to list isn't. */}
        {drafts !== null && rows.length === 0 && (
          <div className={listStyles.message}>
            <p className={listStyles.hint}>
              Changes you don’t save are kept here, in this browser, for up to 7
              days.
            </p>
          </div>
        )}
        {rows.length > 0 && (
          <>
            <p className={classNames(listStyles.hint, styles.intro)}>
              Unsaved work from this browser, kept for up to 7 days.
            </p>
            <ul role="list" className={styles.list}>
              {rows.map((record) =>
                deleted[record.id] ? (
                  <DeletedRow
                    key={record.id}
                    record={record}
                    undoId={undoId(record.id)}
                    onUndo={() => undo(record)}
                  />
                ) : (
                  <DraftRow
                    key={record.id}
                    record={record}
                    current={record.id === currentId}
                    opening={openingId === record.id}
                    now={now}
                    openId={openId(record.id)}
                    metaId={metaId(record.id)}
                    onOpen={() => open(record)}
                    onDelete={() => remove(record)}
                  />
                ),
              )}
            </ul>
          </>
        )}
        <div role="status" aria-live="polite" className={u.visuallyHidden}>
          <span key={status.id}>{status.text}</span>
        </div>
      </Drawer.Body>
    </Tabs.Panel>
  );
};

export default UnsavedScenes;
