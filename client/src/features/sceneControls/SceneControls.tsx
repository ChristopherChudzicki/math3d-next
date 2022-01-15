import React, { useEffect } from "react";
import { useAppSelector } from "app/hooks";
import { getScene } from "api";
import { MathItem } from "./mathItems";
import ControlTabs from "./controlTabs";
import AddObjectButton from "./AddObjectButton";
import defaultScene from "./defaultScene";

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
  useEffect(() => {
    const loadScene = async () => {
      const scene =
        sceneId !== undefined ? await getScene(sceneId) : defaultScene;
    };
    loadScene();
  }, [sceneId]);
  const mathItemIds = useAppSelector((state) => Object.keys(state.mathItems));
  return (
    <ControlTabs
      mainNav={<MainNav />}
      mainContent={mathItemIds.map((id) => (
        <MathItem id={id} key={id} />
      ))}
      axesNav={<AxesNav />}
      axesdContent="axes stuff"
    />
  );
};

export default SceneControls;
