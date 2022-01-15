import type { Scene } from "types";
import { fetchJson } from "./util";

const getScene = async (sceneId: string): Promise<Scene> => {
  const { result: scene } = await fetchJson<{ result: Scene }>(
    `/scene/${sceneId}`
  );
  return scene;
};

export { getScene };
