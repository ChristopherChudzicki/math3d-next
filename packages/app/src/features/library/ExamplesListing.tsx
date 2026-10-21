import React from "react";
import { useParams } from "react-router";
import { useExampleScenes } from "@math3d/api";
import { Drawer } from "@/ui/Drawer";
import LoadingSpinner from "@/ui/LoadingSpinner";
import { useKeptFailure } from "@/util/hooks";
import LoadFailed from "./LoadFailed";
import SceneCard from "./SceneCard/SceneCard";
import { ListType, cardTitle, sceneHref } from "./constants";
import styles from "./ScenesList.module.css";

/** Enough for every example in one page. */
const EXAMPLES_LIMIT = 100;

const ExamplesListing: React.FC = () => {
  const { sceneKey } = useParams();
  const query = useExampleScenes({ limit: EXAMPLES_LIMIT });
  const { failure, retrying, failedAttempts, retry } = useKeptFailure(
    { error: query.error, hasData: !!query.data, refetch: query.refetch },
    { key: "examples" },
  );

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
    if (failure) {
      return (
        <LoadFailed
          message="Couldn’t load examples."
          retrying={retrying}
          failedAttempts={failedAttempts}
          retry={retry}
        />
      );
    }
    return <LoadingSpinner label="Loading examples" />;
  };

  return <Drawer.Body>{renderBody()}</Drawer.Body>;
};

export default ExamplesListing;
