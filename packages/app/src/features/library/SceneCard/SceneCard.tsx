import React, { useId, useState } from "react";
import classNames from "classnames";
import { Link } from "react-router";
import { Icon } from "@iconify/react/offline";
import axis3d from "@iconify-icons/lucide/axis-3d";
import * as styles from "./SceneCard.module.css";

const { format } = new Intl.DateTimeFormat(navigator.languages[0]);

type SceneCardProps = {
  title: string;
  to: string;
  /** May 404 (no render yet); the placeholder stays until it loads. */
  imageUrl?: string | null;
  /**
   * The scene already open. A plain click on its card doesn't follow the link;
   * it calls `onCurrentClick`, if given.
   */
  current?: boolean;
  onCurrentClick?: () => void;
  /** ISO timestamp. With it, the card shows a "Last modified" line. */
  modifiedDate?: string;
  archived?: boolean;
  /** Controls shown above the card's link, e.g. a menu trigger. */
  actions?: React.ReactNode;
};

/**
 * Sits over the placeholder, revealed once loaded. On error it goes away and
 * the placeholder stays. Keyed by URL, so a new URL starts over.
 */
const Thumbnail: React.FC<{ src: string }> = ({ src }) => {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );
  if (status === "error") return null;
  return (
    <img
      className={styles.thumbnail}
      src={src}
      alt=""
      loading="lazy"
      data-loaded={status === "loaded" ? "" : undefined}
      onLoad={() => setStatus("loaded")}
      onError={() => setStatus("error")}
    />
  );
};

const isPlainClick = (e: React.MouseEvent) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * A scene in a grid; render it inside a list. The title link covers the whole
 * card, and `actions` sit above it, so the two never nest.
 */
const SceneCard: React.FC<SceneCardProps> = ({
  title,
  to,
  imageUrl,
  current = false,
  onCurrentClick,
  modifiedDate,
  archived = false,
  actions,
}) => {
  const metaId = useId();
  const hasMeta = modifiedDate !== undefined;
  const handleClick = (e: React.MouseEvent) => {
    // Following the link would replace this entry (same URL), dropping the
    // history state useOverlay's close() needs, or push a second entry for
    // the open scene.
    if (current && isPlainClick(e)) {
      e.preventDefault();
      onCurrentClick?.();
    }
  };
  return (
    <li className={classNames(styles.card, current && styles.current)}>
      <div className={styles.image}>
        <Icon icon={axis3d} aria-hidden="true" />
        {imageUrl ? <Thumbnail key={imageUrl} src={imageUrl} /> : null}
      </div>
      <div className={styles.text}>
        <h3 className={styles.title}>
          <Link
            to={to}
            className={styles.link}
            aria-current={current ? "page" : undefined}
            aria-describedby={hasMeta ? metaId : undefined}
            onClick={handleClick}
          >
            {/* title reveals a clamped title; on the link it would become
                its accessible description and repeat the name. */}
            <span className={styles.titleText} title={title}>
              {title}
            </span>
          </Link>
        </h3>
        {hasMeta ? (
          <p id={metaId} className={styles.meta}>
            Last modified{" "}
            <time dateTime={modifiedDate}>
              {format(new Date(modifiedDate))}
            </time>
            {archived ? <span className={styles.badge}>Archived</span> : null}
          </p>
        ) : null}
      </div>
      {current ? (
        // aria-current on the link already says this to screen readers.
        <span
          className={classNames(styles.badge, styles.currentBadge)}
          aria-hidden="true"
        >
          Current
        </span>
      ) : null}
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </li>
  );
};

export default SceneCard;
export type { SceneCardProps };
