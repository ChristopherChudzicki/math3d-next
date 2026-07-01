/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from "react";

import Link from "@mui/material/Link";
import { useToggle } from "@/util/hooks";
import { Typography } from "@mui/material";
import type { ReferenceEntry } from "./data.compile";
import * as styles from "./ReferencePanel.module.css";
import { groupEntries } from "./util";

type ReferencePanelProps = {
  entries: ReferenceEntry[];
};

const ReferenceRow = ({ entry }: { entry: ReferenceEntry }) => {
  const hasDetails = !!entry.detailsHtml;
  const [expanded, setExpanded] = useToggle(false);
  const showMoreRef = React.useRef<HTMLButtonElement>(null);
  const showLessRef = React.useRef<HTMLButtonElement>(null);
  const interacted = React.useRef(false);

  // Toggling swaps "Show more" for "Show less" (and vice versa), which are
  // separate elements in different positions. Without intervention the focused
  // toggle unmounts and focus falls back to <body>, stranding keyboard users.
  // Move focus to whichever toggle just appeared, but only after a real click.
  React.useEffect(() => {
    if (!interacted.current) return;
    const target = expanded ? showLessRef.current : showMoreRef.current;
    target?.focus();
  }, [expanded]);

  const toggle = () => {
    interacted.current = true;
    setExpanded.toggle();
  };

  return (
    <tr className={styles.row}>
      <td dangerouslySetInnerHTML={{ __html: entry.latex }} />
      <td>
        <span className={styles.keyboard}>{entry.keyboard}</span>
      </td>
      <td>
        <div>
          <p>
            <span
              dangerouslySetInnerHTML={{ __html: entry.summaryInnerHtml }}
            />
            {hasDetails && !expanded && (
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <Link
                ref={showMoreRef}
                onClick={toggle}
                sx={{ verticalAlign: "baseline", marginLeft: "0.5em" }}
                component="button"
              >
                Show more
              </Link>
            )}
          </p>
        </div>
        {expanded && entry.detailsHtml && (
          <>
            <div dangerouslySetInnerHTML={{ __html: entry.detailsHtml }} />
            {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
            <Link
              ref={showLessRef}
              onClick={toggle}
              sx={{ verticalAlign: "baseline" }}
              component="button"
            >
              Show less
            </Link>
          </>
        )}
      </td>
    </tr>
  );
};

const ReferenceTable: React.FC<ReferencePanelProps> = ({ entries }) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.row}>
          <th>Expression</th>
          <th>Keyboard</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <ReferenceRow key={entry.id} entry={entry} />
        ))}
      </tbody>
    </table>
  );
};

const ReferencePanel: React.FC<ReferencePanelProps> = ({ entries }) => {
  const groups = groupEntries(entries);

  return groups.map((group) => (
    <React.Fragment key={group.tag}>
      <Typography
        component="h2"
        variant="h5"
        id={group.tag}
        sx={{ marginBottom: "16px", marginTop: "16px" }}
      >
        {group.label}
      </Typography>
      <ReferenceTable entries={group.entries} />
    </React.Fragment>
  ));
};

export default ReferencePanel;
