import { Icon } from "@iconify/react/offline";
import chevronLeft from "@iconify-icons/lucide/chevron-left";
import chevronRight from "@iconify-icons/lucide/chevron-right";
import classNames from "classnames";
import React, { useCallback, useId, useMemo } from "react";

import IconButton from "../IconButton";
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
  const icon = useMemo(() => {
    const direction = getButtonDirection(visible, side);
    if (direction === "left") return chevronLeft;
    if (direction === "right") return chevronRight;
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
        <IconButton
          onClick={handleClick}
          className={style["sidebar-button"]}
          aria-controls={regionId}
          aria-expanded={visible}
          label={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
        >
          <Icon icon={icon} aria-hidden="true" />
        </IconButton>
      </div>
      <div role="region" id={regionId} {...inertness}>
        {children}
      </div>
    </div>
  );
};

export default Sidebar;
