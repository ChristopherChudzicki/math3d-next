import classNames from "classnames";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  mathItemConfigs as configs,
  MathItemType as MIT,
} from "@math3d/mathitem-configs";
import React, { useCallback } from "react";

import IconButton from "@/ui/IconButton";
import { positioning } from "@/util/styles";
import u from "@/util/styles/utils.module.css";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Folder.module.css";
import { useMathResults } from "../../mathScope";
import { useOnWidgetChange } from "../../FieldWidget";
import { WidgetChangeEvent } from "../../FieldWidget/types";
import { useMathScope } from "../../sceneSlice";

interface FolderButtonProps {
  onClick: React.MouseEventHandler;
  isCollapsed: boolean;
}

const FolderButton: React.FC<FolderButtonProps> = ({
  onClick,
  isCollapsed,
}) => {
  return (
    <IconButton
      size="sm"
      onClick={onClick}
      className={classNames(
        positioning["absolute-centered"],
        styles.toggleButton,
      )}
      label="Expand/Collapse Folder"
    >
      <span
        className={classNames(
          {
            [styles["rotate-90"]]: isCollapsed,
            [styles["rotate-0"]]: !isCollapsed,
          },
          u.dFlex,
          u.alignItemsCenter,
          u.justifyContentCenter,
        )}
      >
        <ExpandMoreIcon fontSize="inherit" />
      </span>
    </IconButton>
  );
};

const EVALUATED_PROPS = ["isCollapsed"];

const Folder: MathItemForm<MIT.Folder> = ({ item }) => {
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
      sideContent={<FolderButton onClick={onClick} isCollapsed={isCollapsed} />}
    />
  );
};

export default Folder;
