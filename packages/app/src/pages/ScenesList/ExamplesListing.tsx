import React from "react";
import { useParams } from "react-router";
import { Dialog } from "@/ui/Dialog";
import { useOverlay } from "@/features/overlays/useOverlay";
import SceneCard from "./SceneCard/SceneCard";
import examplesData from "./examples_data.json";
import styles from "./ScenesList.module.css";

const ExamplesListing: React.FC = () => {
  const { sceneKey } = useParams();
  const { close } = useOverlay();
  return (
    <Dialog.Body>
      <ul role="list" className={styles.grid}>
        {examplesData.map((e) => (
          <SceneCard
            key={e.id}
            to={`/${e.id}`}
            title={e.text.primary}
            current={e.id === sceneKey}
            onCurrentClick={close}
          />
        ))}
      </ul>
    </Dialog.Body>
  );
};

export default ExamplesListing;
