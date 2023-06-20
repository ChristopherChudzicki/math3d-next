import axios from "redaxios";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Scene } from "@/types";
import defaultScene from "./defaultScene";

const getScene = async (sceneId: string): Promise<Scene> => {
  const { data } = await axios.get(`/api/scenes/${sceneId}/`);
  return {
    items: data.items,
    title: data.title,
    itemOrder: data.item_order,
    id: data.key,
  };
};

const getSceneKey = (id?: string): [string] => [`/scenes/${id}`];

const useScene = (id?: string) => {
  const queryKey = getSceneKey(id);
  return useQuery({
    queryKey,
    queryFn: () => getScene(id!),
    enabled: !!id,
    initialData: defaultScene,
  });
};

const createScene = async (scene: Omit<Scene, "id">): Promise<Scene> => {
  const { data } = await axios.post<Scene>("/api/scenes/", {
    items: scene.items,
    title: scene.title,
    item_order: scene.itemOrder,
  });
  return data;
};

const useCreateScene = () => {
  return useMutation({
    mutationFn: createScene,
  });
};

export { getScene, useScene, useCreateScene };
