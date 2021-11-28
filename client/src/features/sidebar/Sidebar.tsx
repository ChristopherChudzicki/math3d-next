import React, { useState } from "react";
import mergeClassNames from "classnames";
import { Button } from "react-bootstrap";
import style from "./Sidebar.module.css";

type CollapseButtonProps = {
  iconDirection: "left" | "right";
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
const CollapseButton: React.FC<CollapseButtonProps> = (props) => {
  const icon =
    props.iconDirection === "left" ? "bi-chevron-left" : "bi-chevron-right";
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={props.onClick}
      className={style["collapse-button"]}
    >
      <i className={mergeClassNames(["bi", icon])}></i>
    </Button>
  );
};

const getButtonIcon = (isCollapsed: boolean, sidebarSide: "left" | "right") => {
  if (sidebarSide === "left") return isCollapsed ? "right" : "left";
  return isCollapsed ? "left" : "right";
};

type SidebarProps = {
  className?: string;
  side: "left" | "right";
};

const Sidebar: React.FC<SidebarProps> = (props) => {
  const [isCollapsed, setCollapsed] = useState(false);
  return (
    <div
      className={mergeClassNames(props.className, style["sidebar-container"], {
        [style["collapsed-left"]]: isCollapsed,
      })}
    >
      <CollapseButton
        iconDirection={getButtonIcon(isCollapsed, props.side)}
        onClick={() => {
          setCollapsed(!isCollapsed);
        }}
      />
      {props.children}
    </div>
  );
};

export default Sidebar;
