import React from "react";
import styles from "./Header.module.css";

type HeaderProps = {
  /** Before the brand, e.g. a button that opens a scene. */
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

export default Header;
