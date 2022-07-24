import type { Scene } from "types";
import axios from "redaxios";

const getScene = async (sceneId: string): Promise<Scene> => {
  const { data } = await axios.get<Scene>(`/scenes/${sceneId}`);
  return data;
};

export { getScene };
