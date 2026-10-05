import React from "react";
import Header from "@/ui/Header";
import TextLink from "@/ui/TextLink";
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
    <Header title={title} nav={<TextLink to="/">Back to Math3d</TextLink>} />
    <main className={styles.main}>
      <div className={styles.card}>{children}</div>
    </main>
  </>
);

export default AppPageLayout;
