import React from "react";
import type { ReferenceEntry } from "./data.compile";
import * as styles from "./ReferenceTable.module.css";

type ReferenceTableProps = {
  entries: ReferenceEntry[];
};

const ReferenceRow = ({ entry }: { entry: ReferenceEntry }) => {
  return (
    <tr className={styles.row}>
      <td dangerouslySetInnerHTML={{ __html: entry.latex }} />
      <td>
        <span className={styles.keyboard}>{entry.keyboard}</span>
      </td>
      <td>
        <div dangerouslySetInnerHTML={{ __html: entry.summary }} />
        <div dangerouslySetInnerHTML={{ __html: entry.details }} />
      </td>
    </tr>
  );
};

const ReferenceTable: React.FC<ReferenceTableProps> = ({ entries }) => {
  return (
    <table className={styles.table}>
      <thead>
        <tr className={styles.headerRow}>
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

export default ReferenceTable;
