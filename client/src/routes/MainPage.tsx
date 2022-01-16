import React from "react";
import { useParams } from "react-router-dom";
import Header from "util/components/header";
import Scene from "features/scene";
import Sidebar from "util/components/sidebar";
import SceneControls from "features/sceneControls";
import styles from "./MainPage.module.css";

const cssVars = {
  "--sidebar-width": "375px",
  "--header-height": "50px",
} as React.CSSProperties;

const MainPage: React.FC = () => {
  const { sceneId } = useParams();
  return (
    <div className={styles.container} style={cssVars}>
      <Header className={styles.header} />
      <div className={styles.body}>
        <Sidebar className={styles.sidebar} side="left">
          <SceneControls sceneId={sceneId} />
        </Sidebar>
        <Sidebar className={styles.sidebar} side="right" />
        <Scene />
      </div>
    </div>
  );
};

export default MainPage;
