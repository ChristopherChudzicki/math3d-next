import axios from "redaxios";
import { useQuery } from "@tanstack/react-query";
import type { Scene } from "@/types";
import defaultScene from "./defaultScene";

const getScene = async (sceneId: string): Promise<Scene> => {
  const { data } = await axios.get<Scene>(`/scenes/${sceneId}`);
  return data;
};

const getSceneKey = (id?: string): [string] => [`/scenes/${id}`];

const useScene = (id?: string) => {
  return useQuery(getSceneKey(id), async (context) => {
    if (id === undefined) {
      return defaultScene;
    }
    const { data } = await axios.get<Scene>(context.queryKey[0]);
    return data;
  });
};

export { getScene, useScene };
