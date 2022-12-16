import mergeClassNames from "classnames";
import React from "react";
import * as MB from "mathbox-react";
import type { MathboxSelection } from "mathbox";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
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
};

const setup = (mathbox: MathboxSelection | null) => {
  // @ts-expect-error For debugging
  window.mathbox = mathbox;
};

const Scene: React.FC<Props> = (props) => {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
  const items = useAppSelector(select.orderedMathItems());
  return (
    <div
      className={mergeClassNames(props.className)}
      style={{ width: "100%", height: "100%" }}
      ref={setContainer}
    >
      {container && items.length >= 12 && (
        <MB.Mathbox container={container} options={mathboxOptions} ref={setup}>
          <MB.Cartesian>
            <MB.Grid axes="xz" />
            {items.filter(isMathGraphic).map((item) => {
              const Graphic = getGraphic(item);
              return <Graphic key={item.id} item={item} />;
            })}
          </MB.Cartesian>
        </MB.Mathbox>
      )}
    </div>
  );
};

export default Scene;
