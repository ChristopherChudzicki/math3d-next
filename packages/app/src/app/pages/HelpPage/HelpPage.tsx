import React from "react";

import Header, { HeaderTitle } from "@/ui/Header";
import TextLink from "@/ui/TextLink";
import ReferencePanel from "./ReferencePanel";
import { docs } from "./docs";
import { groupDocs } from "./util";
import * as styles from "./HelpPage.module.css";

const HelpPage: React.FC = () => {
  const groups = groupDocs(docs);
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
              <li key={group.id}>
                <TextLink href={`#${group.id}`}>{group.label}</TextLink>
              </li>
            ))}
          </ul>
        </nav>
        <div>
          <ReferencePanel docs={docs} />
        </div>
      </div>
    </>
  );
};

export default HelpPage;
