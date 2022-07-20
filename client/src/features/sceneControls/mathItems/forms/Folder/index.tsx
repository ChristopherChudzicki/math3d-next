import classNames from "classnames";
import { DownOutlined } from "@ant-design/icons";
import { mathItemConfigs as configs, MathItemType as MIT } from "configs";
import React, { useCallback, useContext } from "react";

import { SubtleButton } from "util/components";
import { positioning } from "util/styles";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Folder.module.css";
import { MathContext, useMathResults } from "../../mathScope";
import { useOnWidgetChange } from "../../FieldWidget";
import { WidgetChangeEvent } from "../../FieldWidget/types";

interface FolderButtonProps {
  onClick: React.MouseEventHandler;
  isCollapsed: boolean;
}

const FolderButton: React.FC<FolderButtonProps> = ({
  onClick,
  isCollapsed,
}) => {
  return (
    /**
     * Need an extra container here because SubtleButton also uses transforms
     */
    <div className={positioning["absolute-centered"]}>
      <SubtleButton onClick={onClick} aria-label="Expand/Collapse Folder">
        <DownOutlined
          className={classNames({
            [styles["rotate-90"]]: isCollapsed,
            [styles["rotate-0"]]: !isCollapsed,
          })}
        />
      </SubtleButton>
    </div>
  );
};

const EVALUATED_PROPS = ["isCollapsed"];

const Folder: MathItemForm<MIT.Folder> = ({ item }) => {
  const evaluated = useMathResults(item.id, EVALUATED_PROPS);
  const isCollapsed = !!evaluated.isCollapsed;
  const mathScope = useContext(MathContext);
  const onWidgetChange = useOnWidgetChange(item);
  const onClick = useCallback(() => {
    const value = String(!isCollapsed);
    const event: WidgetChangeEvent = {
      value,
      name: "isCollapsed",
      mathScope,
    };
    onWidgetChange(event);
  }, [isCollapsed, onWidgetChange, mathScope]);
  return (
    <ItemTemplate
      item={item}
      config={configs[MIT.Folder]}
      showAlignmentBar={false}
      sideContent={<FolderButton onClick={onClick} isCollapsed={isCollapsed} />}
    />
  );
};

export default Folder;
