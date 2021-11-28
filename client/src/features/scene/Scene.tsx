import React from "react";
import mergeClassNames from "classnames";

type Props = {
  className?: string;
};

const Scene: React.FC<Props> = (props) => {
  return (
    <div
      className={mergeClassNames(props.className)}
      style={{ backgroundColor: "aquamarine", width: "100%", height: "100%" }}
      onClick={() => {
        alert("clicked");
      }}
    ></div>
  );
};

export default Scene;
