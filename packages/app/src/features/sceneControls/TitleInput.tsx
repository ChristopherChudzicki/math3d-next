import { useAppSelector } from "@/store/hooks";
import React, { useCallback } from "react";
import { select, useSetTitle } from "./mathItems/sceneSlice";
import AutosizeText from "./mathItems/FieldWidget/AutosizeText";
import { OnWidgetChange } from "./mathItems/FieldWidget/types";
import styles from "./TitleInput.module.css";

const TitleInput: React.FC = () => {
  const title = useAppSelector(select.title);
  const setTitle = useSetTitle();
  const onChange: OnWidgetChange<string> = useCallback(
    (e) => {
      setTitle(e.value);
    },
    [setTitle],
  );
  return (
    <AutosizeText
      className={styles["scene-title"]}
      value={title}
      name="title"
      label="Scene Title"
      onChange={onChange}
    />
  );
};

export default TitleInput;
