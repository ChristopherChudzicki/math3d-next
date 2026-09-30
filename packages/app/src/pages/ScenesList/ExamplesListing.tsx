import React from "react";
import { useParams } from "react-router";
import { Drawer } from "@/ui/Drawer";
import SceneCard from "./SceneCard/SceneCard";
import { ListType, sceneHref } from "./constants";
import examplesData from "./examples_data.json";
import styles from "./ScenesList.module.css";

const ExamplesListing: React.FC = () => {
  const { sceneKey } = useParams();
  return (
    <Drawer.Body>
      <ul role="list" className={styles.grid}>
        {examplesData.map((e) => (
          <SceneCard
            key={e.id}
            to={sceneHref(e.id, ListType.Examples)}
            title={e.text.primary}
            current={e.id === sceneKey}
          />
        ))}
      </ul>
    </Drawer.Body>
  );
};

export default ExamplesListing;
