import React from "react";
import Header, { HomeLink } from "@/ui/Header";
import TextLink from "@/ui/TextLink";
import { homeLink } from "@/services/navigation/links";
import styles from "./AppPageLayout.module.css";

/**
 * Shell for standalone `/app/...` pages that aren't dialogs — currently the
 * soft-404. The branded header plus a narrow, horizontally-centered card so
 * content sits in a sensible band instead of spanning the viewport.
 */
const AppPageLayout: React.FC<{
  title?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <>
    <Header
      brand={<HomeLink {...homeLink} />}
      title={title}
      nav={<TextLink {...homeLink}>Back to Math3d</TextLink>}
    />
    <main className={styles.main}>
      <div className={styles.card}>{children}</div>
    </main>
  </>
);

export default AppPageLayout;
