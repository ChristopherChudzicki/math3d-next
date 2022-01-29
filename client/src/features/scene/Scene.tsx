import React from "react";
import mergeClassNames from "classnames";

type Props = {
  className?: string;
};

const Scene: React.FC<Props> = (props) => (
  // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
  <div
    className={mergeClassNames(props.className)}
    style={{ backgroundColor: "aquamarine", width: "100%", height: "100%" }}
    onClick={() => {
      alert("clicked");
    }}
  />
);

export default Scene;
