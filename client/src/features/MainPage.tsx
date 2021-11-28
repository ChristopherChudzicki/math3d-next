import React from "react";
import Header from "./header";
import Scene from "./scene";
import Sidebar from "./sidebar";
import SceneControsl from "./sceneControls";
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
          <SceneControsl />
        </Sidebar>
        <Scene />
      </div>
    </div>
  );
};

export default MainPage;
