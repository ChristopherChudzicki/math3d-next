import React, { useState } from "react";
import { Tab, Button, Nav } from "react-bootstrap";
import ScrollingYOverflowX from "../../util/components/scrollingOverflow";
import style from "./SceneControls.module.css";

const SceneControls: React.FC = (props) => {
  const [someText, setSomeText] = useState(
    "the quck brown fox jumps over the lazy dog".repeat(3)
  );
  return (
    <Tab.Container id="sidebar-controls" defaultActiveKey="main">
      <Nav variant="tabs" className={style["tab-navs"]}>
        <Nav.Item className={style["tab-nav"]}>
          <Nav.Link eventKey="main">
            Main
            <Button className="mx-3" variant="outline-secondary">
              Add Object
            </Button>
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
            {Array(50)
              .fill(null)
              .map((x, i) => {
                if (i === 15) {
                  return (
                    <div
                      style={{
                        border: "1pt solid blue",
                        height: "25px",
                        backgroundColor: "orange",
                      }}
                      key={i}
                    >
                      <input
                        type="text"
                        size={Math.max(10, someText.length)}
                        value={someText}
                        onChange={(e) => {
                          setSomeText(e.target.value);
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <div
                    style={{ border: "1pt solid blue", height: "25px" }}
                    key={i}
                  >
                    {i}
                  </div>
                );
              })}
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
