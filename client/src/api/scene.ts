import type { Scene } from "types";

import { fetchJson } from "./util";

const getScene = async (sceneId: string): Promise<Scene> => {
  const { result } = await fetchJson<{ result: { scene: Scene } }>(
    `/scenes/${sceneId}`
  );
  const { scene } = result;
  return scene;
};

export { getScene };
