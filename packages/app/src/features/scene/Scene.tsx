import mergeClassNames from "classnames";
import React, { useMemo } from "react";
import * as MB from "mathbox-react";
import type { MathboxSelection } from "mathbox";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Vector3 } from "three";
import {
  isMathGraphic,
  MathItem,
  MathItemType,
} from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { debounce } from "lodash-es";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  actions,
  select,
  useMathScope,
} from "../sceneControls/mathItems/sceneSlice";
import { Graphic, graphicNeedsRange } from "./graphics";
import useAxesInfo from "./useAxesInfo";
import Camera from "./Camera";
import type { OnMoveEnd } from "./Camera";
import { ZOOM_FACTOR } from "./dollyZoom";
import { useMathResults } from "../sceneControls/mathItems/mathScope";

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

const isSurface = (item: MathItem) => {
  return [
    MathItemType.ParametricSurface,
    MathItemType.ExplicitSurface,
    MathItemType.ExplicitSurfacePolar,
    MathItemType.ImplicitSurface,
  ].includes(item.type);
};

window.graphicOrders = [];

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z", "camera"];
const SceneContent = () => {
  const dispatch = useAppDispatch();
  const items = useAppSelector(select.stableOrderedMathItems);
  const graphicOrder = useAppSelector(select.defaultGraphicOrder);
  const [x, y, z, camera] = useAppSelector((state) =>
    select.getItems(state, REQUIRED_ITEMS),
  );
  invariant(camera.type === MathItemType.Camera);
  const { scale, range } = useAxesInfo(x, y, z);

  const onCameraChange: OnMoveEnd = useMemo(() => {
    const cb: OnMoveEnd = (event) => {
      dispatch(
        actions.patchProperty({
          id: camera.id,
          path: "/position",
          value: `[${event.position.map((pos) => pos.toPrecision(6))}]`,
        }),
      );
      dispatch(
        actions.patchProperty({
          id: camera.id,
          path: "/target",
          value: `[${event.target.map((pos) => pos.toPrecision(6))}]`,
        }),
      );
    };
    return debounce(cb, 200);
  }, [dispatch, camera.id]);

  return (
    <MB.Cartesian range={range} scale={scale}>
      <Camera
        item={camera}
        range={range}
        scale={scale}
        onMoveEnd={onCameraChange}
      />
      {items.filter(isMathGraphic).map((item) => {
        const others = {
          ...(graphicNeedsRange(item.type) ? { range } : {}),
        };
        return (
          <Graphic
            key={item.id}
            item={item}
            zOrder={graphicOrder[item.id]}
            {...others}
          />
        );
      })}
    </MB.Cartesian>
  );
};

const cameraProps = ["isOrthographic"] as const;
const useIsOrthographic = () => {
  const scope = useMathScope();
  const { isOrthographic } = useMathResults(scope, "camera", cameraProps);
  return !!isOrthographic;
};

const Scene: React.FC<Props> = (props) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const hasRequired = useAppSelector(select.hasItems(REQUIRED_ITEMS));

  const isOrthographic = useIsOrthographic();
  const focus = isOrthographic ? ZOOM_FACTOR : 1;
  return (
    <div
      data-testid="scene"
      className={mergeClassNames(props.className)}
      style={{ width: "100%", height: "100%" }}
      ref={setContainer}
    >
      {container && hasRequired && (
        <MB.Mathbox
          container={container}
          options={mathboxOptions}
          focus={focus}
          ref={setup}
        >
          <SceneContent />
        </MB.Mathbox>
      )}
    </div>
  );
};

export default Scene;
