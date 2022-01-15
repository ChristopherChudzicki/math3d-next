import type { Scene } from "types";
import { fetchJson } from "./util";

const getScene = async (sceneId: string): Promise<Scene> => {
  const { result } = await fetchJson<{ result: { scene: Scene } }>(
    `/scene/${sceneId}`
  );
  const { scene } = result;
  return scene;
};

export { getScene };
