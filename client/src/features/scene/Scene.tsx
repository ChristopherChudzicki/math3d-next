import mergeClassNames from "classnames";
import React from "react";

type Props = {
  className?: string;
};

const Scene: React.FC<Props> = (props) => (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  <div
    className={mergeClassNames(props.className)}
    style={{ backgroundColor: "aquamarine", width: "100%", height: "100%" }}
    onClick={() => {
      // eslint-disable-next-line no-alert
      alert("clicked");
    }}
  />
);

export default Scene;
