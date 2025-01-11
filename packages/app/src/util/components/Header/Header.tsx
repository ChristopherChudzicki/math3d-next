import React from "react";
import styles from "./Header.module.css";

type HeaderProps = {
  title: React.ReactNode;
  nav: React.ReactNode;
};

const Header: React.FC<HeaderProps> = (props) => (
  <header className={styles.header}>
    <span className={styles.brand}>Math3d</span>
    {props.title}
    <nav className={styles["nav-container"]}>{props.nav}</nav>
  </header>
);

export default Header;
