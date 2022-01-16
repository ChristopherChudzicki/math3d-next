import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "app/hooks";
import { getScene } from "api";
import { MathItem } from "./mathItems";
import ControlTabs from "./controlTabs";
import AddObjectButton from "./AddObjectButton";
import defaultScene from "./defaultScene";
import { slice as mathItemsSlice } from "./mathItems";

const { actions: itemActions } = mathItemsSlice;

type Props = {
  sceneId?: string;
};

const MainNav: React.FC = () => (
  <>
    Main
    <AddObjectButton className="mx-3" />
  </>
);
const AxesNav: React.FC = () => (
  <div className="text-center">
    Axes and <br /> Camera
  </div>
);

const SceneControls: React.FC<Props> = (props) => {
  const { sceneId } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    const loadScene = async () => {
      const scene =
        sceneId !== undefined ? await getScene(sceneId) : defaultScene;
      console.log(scene);
      dispatch(itemActions.addItems({ items: scene.items }));
    };
    loadScene();
  }, [sceneId]);
  const items = useAppSelector((state) => Object.values(state.mathItems));
  return (
    <ControlTabs
      mainNav={<MainNav />}
      mainContent={items.map((item) => (
        <MathItem item={item} key={item.id} />
      ))}
      axesNav={<AxesNav />}
      axesdContent="axes stuff"
    />
  );
};

export default SceneControls;
