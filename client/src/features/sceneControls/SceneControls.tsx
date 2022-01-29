import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "app/hooks";
import { getScene } from "api";
import { MathItem, slice as mathItemsSlice } from "./mathItems";
import ControlTabs from "./controlTabs";
import AddObjectButton from "./AddObjectButton";
import defaultScene from "./defaultScene";

const { actions: itemActions } = mathItemsSlice;

type Props = {
  sceneId?: string;
};

const MainNav: React.FC = () => <>Main</>;

const AxesNav: React.FC = () => (
  <div className="text-center">
    Axes &amp; <br /> Camera
  </div>
);

const SceneControls: React.FC<Props> = (props) => {
  const { sceneId } = props;
  const dispatch = useAppDispatch();
  useEffect(() => {
    const loadScene = async () => {
      const scene =
        sceneId !== undefined ? await getScene(sceneId) : defaultScene;
      dispatch(itemActions.addItems({ items: scene.items }));
    };
    loadScene();
  }, [dispatch, sceneId]);
  const items = useAppSelector((state) => Object.values(state.mathItems));
  return (
    <ControlTabs
      tabBarExtraContent={<AddObjectButton />}
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
