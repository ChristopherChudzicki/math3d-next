import React from "react";
import { useParams } from "react-router-dom";
import Scene from "@/features/scene";
import SceneControls from "@/features/sceneControls";
import Sidebar from "@/util/components/sidebar";

import { useToggle } from "@/util/hooks";
import classNames from "classnames";
import Button from "@mui/material/Button";
import TitleInput from "@/features/sceneControls/TitleInput";
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import styles from "./MainPage.module.css";

const cssVars = {
  "--sidebar-width": "375px",
  "--header-height": "50px",
  "--sidebar-z": "10",
  "--sidebar-duration": "0.5s",
} as React.CSSProperties;

type HeaderProps = {
  className?: string;
  title: React.ReactNode;
};

const Header: React.FC<HeaderProps> = (props) => (
  <header className={classNames(props.className)}>
    <div className={styles["header-container"]}>
      <span className={styles.brand}>Math3d</span>
      {props.title}
      <nav className={styles["nav-container"]}>
        <Button
          href="#examples"
          variant="text"
          color="secondary"
          startIcon={<LightbulbOutlined fontSize="inherit" />}
        >
          Examples
        </Button>
        <Button
          variant="text"
          color="secondary"
          startIcon={<CloudOutlinedIcon fontSize="inherit" />}
        >
          Share
        </Button>
        <Button
          variant="text"
          color="secondary"
          startIcon={<HelpOutlineOutlinedIcon fontSize="inherit" />}
        >
          Contact
        </Button>
      </nav>
    </div>
  </header>
);

const MainPage: React.FC = () => {
  const [controlsOpen, toggleControlsOpen] = useToggle(true);
  const { sceneId } = useParams();
  return (
    <div className={styles.container} style={cssVars}>
      <Header title={<TitleInput />} className={styles.header} />
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
