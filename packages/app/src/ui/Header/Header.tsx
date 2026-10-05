import React from "react";
import styles from "./Header.module.css";

type HeaderProps = {
  /** Before the brand, e.g. the button that opens the scenes dialog. */
  start?: React.ReactNode;
  title: React.ReactNode;
  nav: React.ReactNode;
};

const Header: React.FC<HeaderProps> = (props) => (
  <header className={styles.header}>
    {/* Rendered even when empty, so the grid columns keep their order. */}
    <div className={styles.start}>{props.start}</div>
    <span className={styles.brand}>Math3d</span>
    {props.title}
    <nav className={styles["nav-container"]}>{props.nav}</nav>
  </header>
);

/** The page's heading, for Header's `title`. */
const HeaderTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 className={styles.title}>{children}</h1>
);

export default Header;
export { HeaderTitle };
