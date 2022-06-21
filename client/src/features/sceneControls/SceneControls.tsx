import { getScene } from "api";
import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

import AddObjectButton from "./AddObjectButton";
import ControlTabs from "./controlTabs";
import { MathItem, slice as mathItemsSlice } from "./mathItems";

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
    const loadScene = async (id: string) => {
      const scene = await getScene(id);
      dispatch(itemActions.addItems({ items: scene.items }));
    };
    if (sceneId) {
      loadScene(sceneId);
    }
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
