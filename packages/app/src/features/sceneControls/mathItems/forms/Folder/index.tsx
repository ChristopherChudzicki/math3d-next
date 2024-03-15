import classNames from "classnames";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
} from "@math3d/mathitem-configs";
import React, { useCallback } from "react";

import { SubtleButton } from "@/util/components";
import { positioning } from "@/util/styles";
import { useAppSelector } from "@/store/hooks";
import u from "@/util/styles/utils.module.css";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Folder.module.css";
import { useMathResults } from "../../mathScope";
import { useOnWidgetChange } from "../../FieldWidget";
import { WidgetChangeEvent } from "../../FieldWidget/types";
import { select, useMathScope } from "../../mathItemsSlice";

interface FolderButtonProps {
  onClick: React.MouseEventHandler;
  isCollapsed: boolean;
  lighten: boolean;
}

const FolderButton: React.FC<FolderButtonProps> = ({
  onClick,
  isCollapsed,
  lighten,
}) => {
  return (
    /**
     * Need an extra container here because SubtleButton also uses transforms
     */
    <div className={positioning["absolute-centered"]}>
      <SubtleButton
        onClick={onClick}
        className={styles.toggleButton}
        aria-label="Expand/Collapse Folder"
        centered
        lighten={lighten}
      >
        <span
          className={classNames(
            {
              [styles["rotate-90"]]: isCollapsed,
              [styles["rotate-0"]]: !isCollapsed,
            },
            styles.color,
            u.dFlex,
            u.alignItemsCenter,
            u.justifyContentCenter
          )}
        >
          <ExpandMoreIcon />
        </span>
      </SubtleButton>
    </div>
  );
};

const EVALUATED_PROPS = ["isCollapsed"];

const Folder: MathItemForm<MIT.Folder> = ({ item }) => {
  const isActive = useAppSelector(select.isActive(item.id));
  const mathScope = useMathScope();
  const evaluated = useMathResults(mathScope, item.id, EVALUATED_PROPS);
  const isCollapsed = !!evaluated.isCollapsed;
  const onWidgetChange = useOnWidgetChange(item);
  const onClick = useCallback(() => {
    const value = String(!isCollapsed);
    const event: WidgetChangeEvent = {
      value,
      name: "isCollapsed",
    };
    onWidgetChange(event);
  }, [isCollapsed, onWidgetChange]);
  return (
    <ItemTemplate
      item={item}
      childItem={false}
      config={configs[MIT.Folder]}
      showAlignmentBar={false}
      sideContent={
        <FolderButton
          lighten={isActive}
          onClick={onClick}
          isCollapsed={isCollapsed}
        />
      }
    />
  );
};

export default Folder;
