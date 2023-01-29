import mergeClassNames from "classnames";
import React, { useCallback } from "react";
import * as MB from "mathbox-react";
import type { MathboxSelection } from "mathbox";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { isMathGraphic, MathItemType } from "@/configs";
import invariant from "tiny-invariant";
import { actions, select } from "../sceneControls/mathItems/mathItemsSlice";
import { Graphic, graphicNeedsRange } from "./graphics";
import useAxesInfo from "./useAxesInfo";
import Camera from "./Camera";
import type { OnMoveEnd } from "./Camera";

type Props = {
  className?: string;
};

const mathboxOptions = {
  plugins: ["core", "controls", "cursor", "stats"],
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

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z", "camera"];
const SceneContent = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(select.orderedMathItems());
  const [x, y, z, camera] = useAppSelector(select.getItems(REQUIRED_ITEMS));
  invariant(camera.type === MathItemType.Camera);
  const { scale, range } = useAxesInfo(x, y, z);
  const onCameraChange: OnMoveEnd = useCallback(
    (event) => {
      dispatch(
        actions.patchProperty({
          id: camera.id,
          path: "/position",
          value: `[${event.position.map((pos) => pos.toPrecision(3))}]`,
        })
      );
      dispatch(
        actions.patchProperty({
          id: camera.id,
          path: "/target",
          value: `[${event.target.map((pos) => pos.toPrecision(3))}]`,
        })
      );
    },
    [dispatch, camera.id]
  );
  return (
    <MB.Cartesian range={range} scale={scale}>
      <Camera item={camera} range={range} onMoveEnd={onCameraChange} />
      {items.filter(isMathGraphic).map((item) => {
        const others = graphicNeedsRange(item.type) ? { range } : undefined;
        return <Graphic key={item.id} item={item} {...others} />;
      })}
    </MB.Cartesian>
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
