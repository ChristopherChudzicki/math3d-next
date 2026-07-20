import React from "react";

import AddObjectButton from "./AddObjectButton";
import ControlTabs from "./controlTabs";
import { MathItemsList } from "./mathItems";
import styles from "./SceneControls.module.css";

type Props = {
  /**
   * Whether the scene is still loading. Scene data-loading lives in
   * `useSceneLoader` (mounted by the page), not here — `SceneControls` is
   * presentation-only and reads scene state from Redux.
   */
  loading: boolean;
};

const SceneControls: React.FC<Props> = ({ loading }) => {
  return (
    <ControlTabs
      loading={loading}
      tabBarExtraContent={
        <AddObjectButton className={styles.AddObjectButton} />
      }
      mainNav="Main"
      mainContent={<MathItemsList rootId="main" />}
      axesNav={
        <div>
          Axes &amp; <br /> Camera
        </div>
      }
      axesdContent={<MathItemsList rootId="setup" />}
    />
  );
};

export default SceneControls;
