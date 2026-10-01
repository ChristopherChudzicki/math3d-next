/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from "react";

import { TextButton } from "@/ui/TextLink";
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
            {hasDetails && (
              // A single toggle that stays mounted across expand/collapse, so
              // it keeps keyboard focus when activated.
              <TextButton
                onClick={setExpanded.toggle}
                aria-expanded={expanded}
                className={styles.toggle}
              >
                {expanded ? "Show less" : "Show more"}
              </TextButton>
            )}
          </p>
        </div>
        {expanded && entry.detailsHtml && (
          <div dangerouslySetInnerHTML={{ __html: entry.detailsHtml }} />
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
