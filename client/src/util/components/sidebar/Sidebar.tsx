import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import mergeClassNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";

import SubtleButtom from "../SubtleButton";
import style from "./Sidebar.module.css";

const getButtonDirection = (
  isCollapsed: boolean,
  sidebarSide: "left" | "right"
) => {
  if (sidebarSide === "left") return isCollapsed ? "right" : "left";
  return isCollapsed ? "left" : "right";
};

type SidebarProps = {
  className?: string;
  side: "left" | "right";
  children?: React.ReactNode;
};

const Sidebar: React.FC<SidebarProps> = (props) => {
  const [isCollapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(
    () => setCollapsed(!isCollapsed),
    [isCollapsed]
  );
  const IconComponent = useMemo(() => {
    const direction = getButtonDirection(isCollapsed, props.side);
    if (direction === "left") return ChevronLeftIcon;
    if (direction === "right") return ChevronRightIcon;
    throw new Error(`Unexpected direction: ${direction}`);
  }, [isCollapsed, props.side]);
  return (
    <div
      className={mergeClassNames(props.className, style["sidebar-container"], {
        [style["left-sidebar-collapsed"]]: props.side === "left" && isCollapsed,
        [style["right-sidebar-collapsed"]]:
          props.side === "right" && isCollapsed,
        [style["right-sidebar"]]: props.side === "right",
      })}
    >
      {/* Wrap the CollapseButton below  */}
      <div
        className={mergeClassNames({
          [style["left-sidebar-collapse-button"]]: props.side === "left",
          [style["right-sidebar-collapse-button"]]: props.side === "right",
        })}
      >
        <SubtleButtom
          onClick={toggleCollapsed}
          className={style["sidebar-button"]}
          centered
        >
          <IconComponent />
        </SubtleButtom>
      </div>
      {props.children}
    </div>
  );
};

export default Sidebar;
