import React, { useState } from "react";
import mergeClassNames from "classnames";
import styles from "./Sidebar.module.css";

type Props = {
  className?: string;
};

const SceneControls: React.FC<Props> = (props) => {
  const [allowPointerEvents, setAllowPointerEvents] = useState(false);

  return (
    <div
      className={mergeClassNames(props.className, styles.sidebar)}
      onPointerMove={(e) => {
        if (e.clientX > 300 && allowPointerEvents) {
          setAllowPointerEvents(false);
        }
        if (e.clientX < 300 && !allowPointerEvents) {
          setAllowPointerEvents(true);
        }
      }}
    >
      <div
        className={mergeClassNames(styles.scrollable, {
          [styles.events]: allowPointerEvents,
        })}
      >
        {Array(50)
          .fill(null)
          .map((x, i) => {
            if (i === 15) {
              return (
                <div
                  style={{
                    border: "1pt solid blue",
                    height: "25px",
                    width: "500px",
                    backgroundColor: "orange",
                  }}
                  key={i}
                >
                  {i}
                </div>
              );
            }
            return (
              <div style={{ border: "1pt solid blue", height: "25px" }} key={i}>
                {i}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default SceneControls;
