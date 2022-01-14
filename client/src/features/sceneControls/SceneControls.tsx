import React from "react";
import { useAppSelector } from "app/hooks";
import { Tab, Nav } from "react-bootstrap";
import ScrollingYOverflowX from "../../util/components/scrollingOverflow";
import style from "./SceneControls.module.css";
import MathItem from "./MathItem";
import AddObjectButton from "./AddObjectButton";

const SceneControls: React.FC = () => {
  const mathItemIds = useAppSelector((state) => Object.keys(state.mathItems));
  return (
    <Tab.Container id="sidebar-controls" defaultActiveKey="main">
      <Nav variant="tabs" className={style["tab-navs"]}>
        <Nav.Item className={style["tab-nav"]}>
          <Nav.Link eventKey="main">
            Main
            <AddObjectButton className="mx-3" />
          </Nav.Link>
        </Nav.Item>
        <Nav.Item className={style["tab-nav"]}>
          <Nav.Link eventKey="axes">
            <span>Axes and Camera</span>
          </Nav.Link>
        </Nav.Item>
      </Nav>
      <Tab.Content className={style["tab-content"]}>
        <Tab.Pane eventKey="main" className={style["tab-pane"]}>
          <ScrollingYOverflowX className="h-100">
            {mathItemIds.map((id) => (
              <MathItem id={id} key={id} />
            ))}
          </ScrollingYOverflowX>
        </Tab.Pane>
        <Tab.Pane eventKey="axes" className={style["tab-pane"]}>
          b
        </Tab.Pane>
      </Tab.Content>
    </Tab.Container>
  );
};

export default SceneControls;
