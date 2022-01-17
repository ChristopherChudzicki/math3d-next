import React, { useState, useRef } from "react";
import mergeClassNames from "classnames";
import styles from "./ScrollingOverflow.module.css";

type Props = {
  className?: string;
  style?: React.CSSProperties;
};

const ScrollingYOverflowX: React.FC<Props> = (props) => {
  const [allowPointerEvents, setAllowPointerEvents] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div className={props.className} style={props.style} ref={rootRef}>
      <div
        className={mergeClassNames(styles.scrollable, {
          [styles.events]: allowPointerEvents,
        })}
        onPointerMove={(e) => {
          const { current: rootEl } = rootRef;
          if (!rootEl) return;
          const rect = rootEl.getBoundingClientRect();

          const isPointerInRootRect =
            e.clientX > rect.left &&
            e.clientX < rect.right &&
            e.clientY > rect.top &&
            e.clientY < rect.bottom;

          if (isPointerInRootRect && !allowPointerEvents) {
            setAllowPointerEvents(true);
          }
          if (!isPointerInRootRect && allowPointerEvents) {
            setAllowPointerEvents(false);
          }
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

export default ScrollingYOverflowX;
