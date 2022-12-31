import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import classNames from "classnames";
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
  defaultOpen?: boolean;
  side: "left" | "right";
  children?: React.ReactNode;
  onOpenStart?: () => void;
  onCloseStart?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({
  defaultOpen = true,
  onCloseStart,
  onOpenStart,
  side,
  children,
  className,
}) => {
  const [isCollapsed, setCollapsed] = useState(!defaultOpen);
  const toggleCollapsed = useCallback(() => {
    const nowCollapsed = !isCollapsed;
    setCollapsed(nowCollapsed);
    if (nowCollapsed) {
      onCloseStart?.();
    } else {
      onOpenStart?.();
    }
  }, [isCollapsed, onCloseStart, onOpenStart]);
  const IconComponent = useMemo(() => {
    const direction = getButtonDirection(isCollapsed, side);
    if (direction === "left") return ChevronLeftIcon;
    if (direction === "right") return ChevronRightIcon;
    throw new Error(`Unexpected direction: ${direction}`);
  }, [isCollapsed, side]);
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
          onClick={toggleCollapsed}
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
