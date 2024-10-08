import { useScene } from "@math3d/api";

import React, { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";

import defaultScene from "@/store/defaultScene";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router";
import AddObjectButton from "./AddObjectButton";
import ControlTabs from "./controlTabs";
import { sceneSlice, MathItemsList } from "./mathItems";
import styles from "./SceneControls.module.css";
import { useNotifications } from "../notifications/NotificationsContext";

const { actions: itemActions } = sceneSlice;

const useLoadSceneIntoRedux = (sceneKey?: string) => {
  const dispatch = useAppDispatch();

  const { isLoading, data, error } = useScene(sceneKey, {
    enabled: sceneKey !== undefined,
    staleTime: Infinity,
  });
  useEffect(() => {
    const title = data?.title ? `Math3d - ${data.title}` : "Math3d";
    document.title = title;
  }, [data]);

  const { add: addNotification } = useNotifications();
  const navigate = useNavigate();
  useEffect(() => {
    if (isAxiosError(error) && error.response?.status === 404) {
      const { confirmed } = addNotification({
        type: "alert",
        title: "Not found",
        body: "The requested scene could not be found.",
      });
      document.title = "Not found";

      confirmed.then(() => {
        navigate("/");
      });
    }
  }, [error, addNotification, navigate]);

  const scene = sceneKey === undefined ? defaultScene : data;

  useEffect(() => {
    if (!scene) return;
    const payload = {
      key: scene.key,
      author: scene.author,
      items: scene.items,
      order: scene.itemOrder,
      title: scene.title ?? "",
    };
    dispatch(itemActions.setItems(payload));
  }, [dispatch, scene]);
  return { isLoading };
};

type Props = {
  sceneKey?: string;
};

const SceneControls: React.FC<Props> = (props) => {
  const { sceneKey } = props;
  const { isLoading } = useLoadSceneIntoRedux(sceneKey);
  return (
    <ControlTabs
      loading={isLoading}
      tabBarExtraContent={
        <AddObjectButton className={styles.AddObjectButton} />
      }
      mainNav="Main"
      mainContent={<MathItemsList rootId="main" />}
      axesNav={
        <div>
          Axes &amp; <br /> Camera
        </div>
      }
      axesdContent={<MathItemsList rootId="setup" />}
    />
  );
};

export default SceneControls;
