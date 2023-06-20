import axios from "redaxios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Scene } from "@/types";
import invariant from "tiny-invariant";
import defaultScene from "./defaultScene";

const sceneFromApi = (data: {
  items: Scene["items"];
  title: Scene["title"];
  item_order: Scene["itemOrder"];
  key: Scene["id"];
}): Scene => ({
  items: data.items,
  title: data.title,
  itemOrder: data.item_order,
  id: data.key,
});

const getScene = async (sceneId: string): Promise<Scene> => {
  console.log("fetching!!");
  const { data } = await axios.get(`/api/scenes/${sceneId}/`);
  return sceneFromApi(data);
};

const getSceneKey = (id?: string): [string] => [`/scenes/${id}`];

const useScene = (id?: string) => {
  const queryKey = getSceneKey(id);
  return useQuery({
    queryKey,
    queryFn: () => {
      invariant(id);
      return getScene(id);
    },
    enabled: !!id,
    initialData: defaultScene,
  });
};

const createScene = async (scene: Omit<Scene, "id">): Promise<Scene> => {
  const { data } = await axios.post("/api/scenes/", {
    items: scene.items,
    title: scene.title,
    item_order: scene.itemOrder,
  });
  return sceneFromApi(data);
};

const useCreateScene = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScene,
    onSuccess: (scene) => {
      queryClient.setQueryData(getSceneKey(scene.id), scene);
    },
  });
};

export { getScene, useScene, useCreateScene };
