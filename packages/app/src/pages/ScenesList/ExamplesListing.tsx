import React from "react";
import { useParams } from "react-router";
import { useExampleScenes } from "@math3d/api";
import Button from "@/ui/Button";
import { Drawer } from "@/ui/Drawer";
import LoadingSpinner from "@/ui/LoadingSpinner";
import SceneCard from "./SceneCard/SceneCard";
import { ListType, cardTitle, sceneHref } from "./constants";
import styles from "./ScenesList.module.css";

/** Enough for every example in one page. */
const EXAMPLES_LIMIT = 100;

const ExamplesListing: React.FC = () => {
  const { sceneKey } = useParams();
  const query = useExampleScenes({ limit: EXAMPLES_LIMIT });

  const renderBody = () => {
    // A failed refetch keeps the previous data; show it over the error.
    if (query.data) {
      if (query.data.items.length === 0) {
        return (
          <div className={styles.message}>
            <p className={styles.hint}>No examples yet.</p>
          </div>
        );
      }
      return (
        <ul role="list" className={styles.grid}>
          {query.data.items.map((scene) => (
            <SceneCard
              key={scene.key}
              to={sceneHref(scene.key, ListType.Examples)}
              title={cardTitle(scene.title)}
              imageUrl={scene.imageUrl}
              current={scene.key === sceneKey}
            />
          ))}
        </ul>
      );
    }
    if (query.isError) {
      return (
        <div className={styles.message}>
          <p className={styles.hint}>Couldn&rsquo;t load examples.</p>
          <Button
            size="sm"
            loading={query.isFetching}
            onClick={() => query.refetch()}
          >
            Retry
          </Button>
        </div>
      );
    }
    return <LoadingSpinner label="Loading examples" />;
  };

  return <Drawer.Body>{renderBody()}</Drawer.Body>;
};

export default ExamplesListing;
