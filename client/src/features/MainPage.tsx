import React from "react";
import Header from "./header";
import Scene from "./scene";
import SceneControls from "./sceneControls";
import styles from "./MainPage.module.css";

const MainPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <Header className={styles.header} />
      <SceneControls className={styles.sidebar} />
      <Scene className={styles.body} />
    </div>
  );
};

export default MainPage;
