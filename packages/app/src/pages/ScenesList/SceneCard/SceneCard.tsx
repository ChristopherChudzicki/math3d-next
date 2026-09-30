import React, { useId } from "react";
import classNames from "classnames";
import { Link } from "react-router";
import { Icon } from "@iconify/react/offline";
import axis3d from "@iconify-icons/lucide/axis-3d";
import * as styles from "./SceneCard.module.css";

const { format } = new Intl.DateTimeFormat(navigator.languages[0]);

type SceneCardProps = {
  title: string;
  to: string;
  imageUrl?: string;
  /** The scene open behind the dialog. */
  current?: boolean;
  /** A plain click on the current scene's card calls this instead of navigating. */
  onCurrentClick?: () => void;
  /** ISO timestamp. With it, the card shows a "Last modified" line. */
  modifiedDate?: string;
  archived?: boolean;
  /** Controls shown above the card's link, e.g. a menu trigger. */
  actions?: React.ReactNode;
  linkRef?: React.Ref<HTMLAnchorElement>;
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
  linkRef,
}) => {
  const metaId = useId();
  const hasMeta = modifiedDate !== undefined;
  const handleClick = (e: React.MouseEvent) => {
    if (current && onCurrentClick && isPlainClick(e)) {
      e.preventDefault();
      onCurrentClick();
    }
  };
  return (
    <li className={classNames(styles.card, current && styles.current)}>
      {imageUrl ? (
        <img className={styles.image} src={imageUrl} alt="" />
      ) : (
        <div className={classNames(styles.image, styles.placeholder)}>
          <Icon icon={axis3d} aria-hidden="true" />
        </div>
      )}
      <div className={styles.text}>
        <h3 className={styles.title}>
          <Link
            ref={linkRef}
            to={to}
            className={styles.link}
            title={title}
            aria-current={current ? "page" : undefined}
            aria-describedby={hasMeta ? metaId : undefined}
            onClick={handleClick}
          >
            <span className={styles.titleText}>{title}</span>
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
