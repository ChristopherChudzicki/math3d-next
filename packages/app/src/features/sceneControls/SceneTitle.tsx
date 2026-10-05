import React, { useState } from "react";
import { useParams } from "react-router";
import classNames from "classnames";
import { Icon } from "@iconify/react/offline";
import pencil from "@iconify-icons/lucide/pencil";
import { useAppSelector } from "@/store/hooks";
import IconButton from "@/ui/IconButton";
import { RenameDialog } from "@/features/sceneActions";
import { UNTITLED, sceneDisplayName } from "@/features/scene/sceneTitle";
import { select } from "./mathItems/sceneSlice";
import styles from "./SceneTitle.module.css";

const SceneTitle: React.FC = () => {
  const title = useAppSelector(select.title);
  const key = useAppSelector(select.key);
  const loaded = useAppSelector((state) => state.scene.loaded);
  const loadCount = useAppSelector((state) => state.scene.loadCount);
  const routeKey = useParams().sceneKey ?? null;
  // The load the dialog was opened on: loading another scene closes it.
  const [renamingLoad, setRenamingLoad] = useState<number | null>(null);
  const ready = loaded && key === routeKey;
  // The route whose scene is on screen. A publish sets the store's key a
  // render before the route follows, and the scene on screen is unchanged.
  const [shownRoute, setShownRoute] = useState(ready ? routeKey : undefined);
  if (ready && shownRoute !== routeKey) setShownRoute(routeKey);
  // Until the route's scene loads, its title isn't known and a rename would
  // be overwritten by the load.
  if (!ready && routeKey !== shownRoute) return null;
  const name = sceneDisplayName(title);
  return (
    <div className={styles.container}>
      <h1 className={classNames(styles.title, { [styles.untitled]: !name })}>
        {name ?? UNTITLED}
      </h1>
      <IconButton
        label="Rename scene"
        size="sm"
        onClick={() => setRenamingLoad(loadCount)}
      >
        <Icon icon={pencil} aria-hidden="true" />
      </IconButton>
      {renamingLoad === loadCount ? (
        <RenameDialog onClose={() => setRenamingLoad(null)} />
      ) : null}
    </div>
  );
};

export default SceneTitle;
