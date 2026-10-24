/* eslint-disable react/no-danger */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React from "react";

import { TextButton } from "@/ui/TextLink";
import { useToggle } from "@/util/hooks";
import type { HelpDoc } from "./types";
import * as styles from "./ReferencePanel.module.css";
import { groupDocs } from "./util";

type ReferencePanelProps = {
  docs: HelpDoc[];
};

const ReferenceRow = ({ doc }: { doc: HelpDoc }) => {
  const hasDetails = !!doc.detailsHtml;
  const [expanded, setExpanded] = useToggle(false);
  return (
    <tr className={styles.row}>
      <td
        className={styles.expression}
        dangerouslySetInnerHTML={{ __html: doc.expressionHtml }}
      />
      <td>
        <span className={styles.keyboard}>{doc.keyboard}</span>
      </td>
      <td className={styles.description}>
        <div>
          <p className={styles.summary}>
            <span dangerouslySetInnerHTML={{ __html: doc.summaryHtml }} />
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
        {expanded && doc.detailsHtml && (
          <div dangerouslySetInnerHTML={{ __html: doc.detailsHtml }} />
        )}
      </td>
    </tr>
  );
};

const ReferenceTable: React.FC<ReferencePanelProps> = ({ docs }) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.row}>
            <th>Expression</th>
            <th>Keyboard</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((doc) => (
            <ReferenceRow key={doc.id} doc={doc} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ReferencePanel: React.FC<ReferencePanelProps> = ({ docs }) => {
  const groups = groupDocs(docs);

  return groups.map((group) => (
    <React.Fragment key={group.id}>
      <h2 className={styles.heading} id={group.id}>
        {group.label}
      </h2>
      <ReferenceTable docs={group.docs} />
    </React.Fragment>
  ));
};

export default ReferencePanel;
