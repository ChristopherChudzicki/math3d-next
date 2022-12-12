import mergeClassNames from "classnames";
import React from "react";
import * as MB from "mathbox-react";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

type Props = {
  className?: string;
};

const mathboxOptions = {
  plugins: ["core", "controls", "cursor"],
  controls: {
    klass: OrbitControls,
  },
};

const Scene: React.FC<Props> = (props) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  return (
    <div
      className={mergeClassNames(props.className)}
      style={{ width: "100%", height: "100%" }}
      ref={setContainer}
    >
      {container && (
        <MB.Mathbox container={container} options={mathboxOptions}>
          <MB.Cartesian>
            <MB.Grid axes="xz" />
          </MB.Cartesian>
        </MB.Mathbox>
      )}
    </div>
  );
};

export default Scene;
