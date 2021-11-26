import React from "react";
import mergeClassNames from "classnames";

type Props = {
  className?: string;
};

const SceneControls: React.FC<Props> = (props) => {
  return <div className={mergeClassNames(props.className)}></div>;
};

export default SceneControls;
