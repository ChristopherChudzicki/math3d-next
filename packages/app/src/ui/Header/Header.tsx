import React from "react";
import Anchor from "@/ui/Anchor";
import type { AnchorComponent, AnchorProps } from "@/ui/Anchor";
import styles from "./Header.module.css";

/** The "Math3d" text, for a control that carries the brand. */
const Wordmark: React.FC = () => (
  <span className={styles.wordmark}>Math3d</span>
);

/**
 * A mouse-only link home, for `Header`'s `brand`; pass it the home link's
 * target (`homeLink`). Pair it with a visible "Back to Math3d" link, which
 * keyboard and screen-reader users get instead.
 */
const HomeLink = ((props: AnchorProps) => (
  <Anchor {...props} tabIndex={-1} aria-hidden="true" className={styles.home}>
    <Wordmark />
  </Anchor>
)) as AnchorComponent;

type HeaderProps = {
  /** The wordmark, or a control containing it, e.g. `HomeLink`. */
  brand: React.ReactNode;
  title: React.ReactNode;
  nav: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({ brand, title, nav }) => (
  <header className={styles.header}>
    <div className={styles.brand}>{brand}</div>
    <div className={styles["title-slot"]}>{title}</div>
    <nav className={styles["nav-container"]}>{nav}</nav>
  </header>
);

/** The page's heading, for Header's `title`. */
const HeaderTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className={styles.title}>{children}</h1>
);

export default Header;
export { HeaderTitle, HomeLink, Wordmark };
