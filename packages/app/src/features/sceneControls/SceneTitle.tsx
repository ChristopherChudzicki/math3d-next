import React, { useState } from "react";
import classNames from "classnames";
import IconButton from "@mui/material/IconButton";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useAppSelector } from "@/store/hooks";
import { RenameDialog } from "@/features/sceneActions";
import { select } from "./mathItems/sceneSlice";
import styles from "./SceneTitle.module.css";

const SceneTitle: React.FC = () => {
  const title = useAppSelector(select.title);
  const [renaming, setRenaming] = useState(false);
  const untitled = title.trim() === "";
  return (
    <div className={styles.container}>
      <h1 className={classNames(styles.title, { [styles.untitled]: untitled })}>
        {untitled ? "Untitled" : title}
      </h1>
      <IconButton
        aria-label="Rename scene"
        size="small"
        onClick={() => setRenaming(true)}
      >
        <EditOutlinedIcon fontSize="small" />
      </IconButton>
      {renaming ? <RenameDialog onClose={() => setRenaming(false)} /> : null}
    </div>
  );
};

export default SceneTitle;
