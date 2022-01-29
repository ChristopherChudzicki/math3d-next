import React, { useState } from "react";
import mergeClassNames from "classnames";
import { Button } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import style from "./Sidebar.module.css";

type CollapseButtonProps = {
  iconDirection: "left" | "right";
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};
const CollapseButton: React.FC<CollapseButtonProps> = (props) => (
    <Button
      type="link"
      shape="round"
      onClick={props.onClick}
      className={props.className}
    >
      {props.iconDirection === "left" ? <LeftOutlined /> : <RightOutlined />}
    </Button>
  );

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
        [style["left-sidebar-collapsed"]]: props.side === "left" && isCollapsed,
        [style["right-sidebar-collapsed"]]:
          props.side === "right" && isCollapsed,
        [style["right-sidebar"]]: props.side === "right",
      })}
    >
      <CollapseButton
        className={mergeClassNames({
          [style["left-sidebar-collapse-button"]]: props.side === "left",
          [style["right-sidebar-collapse-button"]]: props.side === "right",
        })}
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
