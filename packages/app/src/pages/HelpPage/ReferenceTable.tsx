import React, { useEffect, useState } from "react";
import { renderMathInElement } from "mathlive";
import type { ReferenceEntry } from "./helpData";
import * as styles from "./ReferenceTable.module.css";

type ReferenceTableProps = {
  entries: ReferenceEntry[];
};

const ReferenceRow = ({ entry }: { entry: ReferenceEntry }) => {
  const [el, setEl] = useState<HTMLTableRowElement | null>(null);
  useEffect(() => {
    if (!el) return;

    renderMathInElement(el);
  }, [entry, el]);
  return (
    <tr className={styles.row} ref={setEl}>
      <td>{entry.latex}</td>
      <td>
        <span className={styles.keyboard}>{entry.keyboard}</span>
      </td>
      <td>{entry.shortDescription}</td>
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
