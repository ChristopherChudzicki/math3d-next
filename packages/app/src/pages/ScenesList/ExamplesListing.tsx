import React from "react";
import { useParams } from "react-router";
import { useExampleScenes } from "@math3d/api";
import Button from "@/ui/Button";
import { Drawer } from "@/ui/Drawer";
import LoadingSpinner from "@/ui/LoadingSpinner";
import { UNTITLED, sceneDisplayName } from "@/features/scene/sceneTitle";
import SceneCard from "./SceneCard/SceneCard";
import { ListType, sceneHref } from "./constants";
import styles from "./ScenesList.module.css";

/** Enough for every example in one page. */
const EXAMPLES_LIMIT = 100;

const ExamplesListing: React.FC = () => {
  const { sceneKey } = useParams();
  const query = useExampleScenes({ limit: EXAMPLES_LIMIT });

  const renderBody = () => {
    if (query.isPending) {
      return <LoadingSpinner label="Loading examples" />;
    }
    if (query.isError) {
      return (
        <div className={styles.message}>
          <p className={styles.hint}>Couldn&rsquo;t load examples.</p>
          <Button size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      );
    }
    return (
      <ul role="list" className={styles.grid}>
        {query.data.items.map((scene) => (
          <SceneCard
            key={scene.key}
            to={sceneHref(scene.key, ListType.Examples)}
            title={sceneDisplayName(scene.title ?? "") ?? UNTITLED}
            imageUrl={scene.imageUrl}
            current={scene.key === sceneKey}
          />
        ))}
      </ul>
    );
  };

  return <Drawer.Body>{renderBody()}</Drawer.Body>;
};

export default ExamplesListing;
