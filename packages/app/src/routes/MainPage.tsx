import React from "react";
import { useParams } from "react-router-dom";
import Scene from "@/features/scene";
import SceneControls from "@/features/sceneControls";
import Header from "@/util/components/header";
import Sidebar from "@/util/components/sidebar";

import { useToggle } from "@/util/hooks";
import styles from "./MainPage.module.css";

const cssVars = {
  "--sidebar-width": "375px",
  "--header-height": "50px",
  "--sidebar-z": "10",
  "--sidebar-duration": "0.5s",
} as React.CSSProperties;

const MainPage: React.FC = () => {
  const [controlsOpen, toggleControlsOpen] = useToggle(true);
  const { sceneId } = useParams();
  return (
    <div className={styles.container} style={cssVars}>
      <Header className={styles.header} />
      <div className={styles.body}>
        <Sidebar
          className={styles.sidebar}
          side="left"
          onCloseStart={toggleControlsOpen.off}
          onOpenStart={toggleControlsOpen.on}
        >
          <SceneControls sceneId={sceneId} />
        </Sidebar>
        <Sidebar className={styles.sidebar} side="right" defaultOpen={false} />
        <Scene
          className={
            controlsOpen
              ? styles["scene-adjust-controls-open"]
              : styles["scene-adjust-controls-closed"]
          }
        />
      </div>
    </div>
  );
};

export default MainPage;
