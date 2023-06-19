import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import classNames from "classnames";
import React, { useCallback, useMemo, useState } from "react";

import SubtleButtom from "../SubtleButton";
import style from "./Sidebar.module.css";

const getButtonDirection = (
  isVisible: boolean,
  sidebarSide: "left" | "right"
) => {
  if (sidebarSide === "left") return isVisible ? "left" : "right";
  return isVisible ? "right" : "left";
};

type SidebarProps = {
  className?: string;
  visible: boolean;
  onVisibleChange?: (current: boolean) => void;
  side: "left" | "right";
  children?: React.ReactNode;
};

const Sidebar: React.FC<SidebarProps> = ({
  side,
  children,
  className,
  visible,
  onVisibleChange,
}) => {
  const isCollapsed = !visible;
  const IconComponent = useMemo(() => {
    const direction = getButtonDirection(visible, side);
    if (direction === "left") return ChevronLeftIcon;
    if (direction === "right") return ChevronRightIcon;
    throw new Error(`Unexpected direction: ${direction}`);
  }, [visible, side]);

  const handleClick = useCallback(() => {
    if (onVisibleChange) onVisibleChange(visible);
  }, [visible, onVisibleChange]);
  return (
    <div
      className={classNames(className, style["sidebar-container"], {
        [style["left-sidebar-collapsed"]]: side === "left" && isCollapsed,
        [style["right-sidebar-collapsed"]]: side === "right" && isCollapsed,
        [style["right-sidebar"]]: side === "right",
      })}
    >
      {/* Wrap the CollapseButton below  */}
      <div
        className={classNames({
          [style["left-sidebar-collapse-button"]]: side === "left",
          [style["right-sidebar-collapse-button"]]: side === "right",
        })}
      >
        <SubtleButtom
          onClick={handleClick}
          className={style["sidebar-button"]}
          centered
        >
          <IconComponent />
        </SubtleButtom>
      </div>
      {children}
    </div>
  );
};

export default Sidebar;
