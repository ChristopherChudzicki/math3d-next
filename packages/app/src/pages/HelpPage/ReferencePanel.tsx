/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from "react";

import Link from "@mui/material/Link";
import { useToggle } from "@/util/hooks";
import classNames from "classnames";
import { Typography } from "@mui/material";
import type { ReferenceEntry } from "./data.compile";
import * as styles from "./ReferencePanel.module.css";
import { Tag, READABLE_TAG } from "./util";

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
            {hasDetails && !expanded && (
              // eslint-disable-next-line jsx-a11y/anchor-is-valid
              <Link
                onClick={setExpanded.on}
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
              onClick={setExpanded.off}
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
          <th>Function</th>
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
  const groupMap = Object.groupBy(entries, (entry) => {
    return entry.tags[0] as Tag;
  });
  const groups = Object.entries(groupMap)
    .map(([tag, group]) => {
      return {
        tag,
        label: READABLE_TAG[tag as Tag],
        entries: group,
      };
    })
    .sort((a, b) => {
      return a.label.localeCompare(b.label);
    });

  return groups.map((group) => (
    <React.Fragment key={group.tag}>
      <Typography
        component="h2"
        variant="h5"
        sx={{ marginBottom: "16px", marginTop: "16px" }}
      >
        {group.label}
      </Typography>
      <ReferenceTable entries={group.entries} />
    </React.Fragment>
  ));
};

export default ReferencePanel;
