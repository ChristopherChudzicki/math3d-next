import React, { useState } from "react";
import { useParams } from "react-router";
import classNames from "classnames";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
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
  // Until the route's scene loads, its title isn't known and a rename would
  // be overwritten by the load.
  if (!loaded || key !== routeKey) return null;
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
        <EditOutlinedIcon fontSize="inherit" />
      </IconButton>
      {renamingLoad === loadCount ? (
        <RenameDialog onClose={() => setRenamingLoad(null)} />
      ) : null}
    </div>
  );
};

export default SceneTitle;
