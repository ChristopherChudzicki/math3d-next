import React from "react";
import { Tab, Nav } from "react-bootstrap";
import ScrollingYOverflowX from "util/components/scrollingOverflow";
import style from "./ControlTabs.module.css";

type Props = {
  mainNav: React.ReactNode;
  axesNav: React.ReactNode;
  mainContent?: React.ReactNode;
  axesdContent?: React.ReactNode;
};

const SceneControls: React.FC<Props> = (props) => {
  return (
    <Tab.Container id="sidebar-controls" defaultActiveKey="main">
      <Nav variant="tabs" className={style["tab-navs"]}>
        <Nav.Item className={style["tab-nav"]}>
          <Nav.Link eventKey="main">{props.mainNav}</Nav.Link>
        </Nav.Item>
        <Nav.Item className={style["tab-nav"]}>
          <Nav.Link eventKey="axes">{props.axesNav}</Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content className={style["tab-content"]}>
        <Tab.Pane eventKey="main" className={style["tab-pane"]}>
          <ScrollingYOverflowX className="h-100">
            {props.mainContent}
          </ScrollingYOverflowX>
        </Tab.Pane>
        <Tab.Pane eventKey="axes" className={style["tab-pane"]}>
          {props.axesdContent}
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default SceneControls;
