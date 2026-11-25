import React from "react";
import Anchor from "@/ui/Anchor";
import styles from "./Header.module.css";

/** The "Math3d" text, for a control that carries the brand. */
const Wordmark: React.FC = () => (
  <span className={styles.wordmark}>Math3d</span>
);

/**
 * A mouse shortcut home. Pages using it carry their own "Back to Math3d"
 * link, so keyboard and screen-reader users aren't handed the same link twice.
 */
const HomeLink: React.FC = () => (
  <Anchor to="/" tabIndex={-1} aria-hidden="true" className={styles.home}>
    <Wordmark />
  </Anchor>
);

type HeaderProps = {
  /** The wordmark, or a control containing it. Defaults to a link to `/`. */
  brand?: React.ReactNode;
  title: React.ReactNode;
  nav: React.ReactNode;
};

const Header: React.FC<HeaderProps> = ({
  brand = <HomeLink />,
  title,
  nav,
}) => (
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
export { HeaderTitle, Wordmark };
