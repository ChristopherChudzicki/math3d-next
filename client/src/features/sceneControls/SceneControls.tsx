import { useScene } from "api/scene";

import React, { useEffect } from "react";
import { useAppDispatch } from "store/hooks";

import AddObjectButton from "./AddObjectButton";
import ControlTabs from "./controlTabs";
import { mathItemsSlice, MathItemsList } from "./mathItems";

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

  const { isLoading, data: scene } = useScene(sceneId);

  useEffect(() => {
    if (!scene) return;
    const payload = { items: scene.items, order: scene.itemOrder };
    dispatch(itemActions.setItems(payload));
  }, [dispatch, scene]);

  return (
    <ControlTabs
      loading={isLoading}
      tabBarExtraContent={<AddObjectButton />}
      mainNav={<MainNav />}
      mainContent={<MathItemsList rootId="main" />}
      axesNav={<AxesNav />}
      axesdContent={<MathItemsList rootId="setup" />}
    />
  );
};

export default SceneControls;
