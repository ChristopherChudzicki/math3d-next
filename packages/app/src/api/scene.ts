import axios from "redaxios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Scene } from "@/types";
import defaultScene from "./defaultScene";

const getScene = async (key: string): Promise<Scene> => {
  const { data } = await axios.get<Scene>(`/api/scenes/${key}/`);
  return data;
};

const getSceneKey = (key?: string): [string] => [`/scenes/${key}`];

const useScene = (key?: string) => {
  const queryKey = getSceneKey(key);
  return useQuery({
    queryKey,
    queryFn: () => {
      if (!key) return defaultScene;
      return getScene(key);
    },
  });
};

const createScene = async (scene: Omit<Scene, "key">): Promise<Scene> => {
  const { data } = await axios.post<Scene>("/api/scenes/", {
    items: scene.items,
    title: scene.title,
    itemOrder: scene.itemOrder,
  });
  return data;
};

const useCreateScene = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScene,
    onSuccess: (scene) => {
      queryClient.setQueryData(getSceneKey(scene.key), scene);
    },
  });
};

export { getScene, useScene, useCreateScene };
