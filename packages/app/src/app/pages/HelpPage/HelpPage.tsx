import React from "react";

import Header, { HeaderTitle } from "@/ui/Header";
import TextLink from "@/ui/TextLink";
import ReferencePanel from "./ReferencePanel";
import { entries } from "./data.compile";
import { groupEntries } from "./util";
import * as styles from "./HelpPage.module.css";

const HelpPage: React.FC = () => {
  const groups = groupEntries(entries);
  return (
    <>
      <Header
        title={<HeaderTitle>Function Reference</HeaderTitle>}
        nav={<TextLink to="/">Back to Math3d</TextLink>}
      />
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Reference Sections">
          <ul>
            {groups.map((group) => (
              <li key={group.tag}>
                <TextLink href={`#${group.tag}`}>{group.label}</TextLink>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <ReferencePanel entries={entries} />
        </div>
      </div>
    </>
  );
};

export default HelpPage;
