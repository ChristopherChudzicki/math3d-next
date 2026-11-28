import React, { useEffect } from "react";

import Header, { HeaderTitle, HomeLink } from "@/ui/Header";
import TextLink from "@/ui/TextLink";
import { homeLink } from "@/services/navigation/links";
import { HELP_REFERENCE_NAME } from "@/config/pageTitle";
import { tabTitle } from "@/store/scene/sceneTitle";
import ReferencePanel from "./ReferencePanel";
import { docs } from "./docs";
import { groupDocs } from "./util";
import * as styles from "./HelpPage.module.css";

const HelpPage: React.FC = () => {
  const groups = groupDocs(docs);
  useEffect(() => {
    document.title = tabTitle(HELP_REFERENCE_NAME);
  }, []);
  return (
    <>
      <Header
        brand={<HomeLink {...homeLink} />}
        title={<HeaderTitle>{HELP_REFERENCE_NAME}</HeaderTitle>}
        nav={<TextLink {...homeLink}>Back to Math3d</TextLink>}
      />
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Reference Sections">
          <ul>
            {groups.map((group) => (
              <li key={group.id}>
                <TextLink to="/app/help/reference" hash={group.id}>
                  {group.label}
                </TextLink>
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
