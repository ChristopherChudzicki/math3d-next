import React from "react";
import Header from "./header";
import Scene from "./scene";
import Sidebar from "../util/components/sidebar";
import SceneControls from "./sceneControls";
import styles from "./MainPage.module.css";

const MainPage: React.FC = () => {
  const cssVars = {
    "--sidebar-width": "375px",
    "--header-height": "50px",
  } as React.CSSProperties;
  return (
    <div className={styles.container} style={cssVars}>
      <Header className={styles.header} />
      <div className={styles.body}>
        <Sidebar className={styles.sidebar} side="left">
          <SceneControls />
        </Sidebar>
        <Sidebar className={styles.sidebar} side="right" />
        <Scene />
      </div>
    </div>
  );
};

export default MainPage;
