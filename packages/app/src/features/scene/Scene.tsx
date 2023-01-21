import mergeClassNames from "classnames";
import React from "react";
import * as MB from "mathbox-react";
import type { MathboxSelection } from "mathbox";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three";
import { useAppSelector } from "@/store/hooks";
import { isMathGraphic } from "@/configs";
import * as select from "../sceneControls/mathItems/mathItemsSlice/selectors";
import { getGraphic } from "./graphics";

type Props = {
  className?: string;
};

const mathboxOptions = {
  plugins: ["core", "controls", "cursor"],
  controls: {
    klass: OrbitControls,
  },
  camera: {
    up: new Vector3(0, 0, 1),
  },
};

const setup = (mathbox: MathboxSelection | null) => {
  // @ts-expect-error For debugging
  window.mathbox = mathbox;
};

const SceneContent = () => {
  const items = useAppSelector(select.orderedMathItems());
  return (
    <MB.Cartesian>
      {items.filter(isMathGraphic).map((item) => {
        const Graphic = getGraphic(item);
        return <Graphic key={item.id} item={item} />;
      })}
    </MB.Cartesian>
  );
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
        <MB.Mathbox container={container} options={mathboxOptions} ref={setup}>
          <SceneContent />
        </MB.Mathbox>
      )}
    </div>
  );
};

export default Scene;
