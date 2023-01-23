import mergeClassNames from "classnames";
import React from "react";
import * as MB from "mathbox-react";
import type { MathboxSelection } from "mathbox";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three";
import { useAppSelector } from "@/store/hooks";
import { isMathGraphic } from "@/configs";
import * as select from "../sceneControls/mathItems/mathItemsSlice/selectors";
import { Graphic } from "./graphics";
import SceneCartesian from "./SceneCartesian";

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

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z"];
const SceneContent = () => {
  const items = useAppSelector(select.orderedMathItems());
  const [x, y, z] = useAppSelector(select.getItems(REQUIRED_ITEMS));
  return (
    <SceneCartesian axisX={x} axisY={y} axisZ={z}>
      {items.filter(isMathGraphic).map((item) => {
        return <Graphic key={item.id} item={item} />;
      })}
    </SceneCartesian>
  );
};

const Scene: React.FC<Props> = (props) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const hasRequired = useAppSelector(select.hasItems(REQUIRED_ITEMS));
  return (
    <div
      className={mergeClassNames(props.className)}
      style={{ width: "100%", height: "100%" }}
      ref={setContainer}
    >
      {container && hasRequired && (
        <MB.Mathbox container={container} options={mathboxOptions} ref={setup}>
          <SceneContent />
        </MB.Mathbox>
      )}
    </div>
  );
};

export default Scene;
