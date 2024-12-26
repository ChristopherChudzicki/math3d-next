import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import classNames from "classnames";
import React, { useCallback, useId, useMemo } from "react";

import SubtleButtom from "../SubtleButton";
import style from "./Sidebar.module.css";

const getButtonDirection = (
  isVisible: boolean,
  sidebarSide: "left" | "right",
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
  label: string;
};

const Sidebar: React.FC<SidebarProps> = ({
  side,
  children,
  className,
  visible,
  onVisibleChange,
  label,
}) => {
  const isCollapsed = !visible;
  const regionId = useId();
  const IconComponent = useMemo(() => {
    const direction = getButtonDirection(visible, side);
    if (direction === "left") return ChevronLeftIcon;
    if (direction === "right") return ChevronRightIcon;
    throw new Error(`Unexpected direction: ${direction}`);
  }, [visible, side]);

  const inertness = isCollapsed ? { inert: true, "aria-hidden": true } : {};

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
          aria-controls={regionId}
          aria-expanded={visible}
          aria-label={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
        >
          <IconComponent />
        </SubtleButtom>
      </div>
      <div role="region" id={regionId} {...inertness}>
        {children}
      </div>
    </div>
  );
};

export default Sidebar;
