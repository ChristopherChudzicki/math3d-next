import React, { useState } from "react";
import ScrollingYOverflowX from "util/components/scrollingOverflow";
import { Tabs, Tab, Button } from "react-bootstrap";
import style from "./Sidebar.module.css";

type Props = {
  className?: string;
};

const SceneControls: React.FC<Props> = (props) => {
  const [someText, setSomeText] = useState(
    "the quick brown fox jumps over the lazy dog".repeat(3)
  );
  return (
    <ScrollingYOverflowX className={props.className}>
      <Tabs>
        <Tab
          eventKey="main"
          tabClassName={style["controls-tab"]}
          title={
            <>
              Main
              <Button className="mx-3" variant="outline-secondary">
                Add Object
              </Button>
            </>
          }
        >
          a
        </Tab>
        <Tab
          eventKey="axes"
          tabClassName={style["controls-tab"]}
          title="Axes & Camera"
        >
          b
        </Tab>
      </Tabs>
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
            <div style={{ border: "1pt solid blue", height: "25px" }} key={i}>
              {i}
            </div>
          );
        })}
    </ScrollingYOverflowX>
  );
};

export default SceneControls;
