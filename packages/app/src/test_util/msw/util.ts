import { MathItem, MathItemType } from "@math3d/mathitem-configs";
import type { PartialBy } from "@math3d/utils";
import type { Scene } from "@/types";
import { makeItem } from "../makeItem";

type PartialScene = PartialBy<Scene, "title" | "key">;

type SceneOptions = Partial<Pick<Scene, "key" | "title">>;

function makeSceneFromItems(items: MathItem[]): PartialScene;
function makeSceneFromItems<T extends SceneOptions>(
  items: MathItem[],
  options: T
): PartialScene & T;
function makeSceneFromItems<T extends SceneOptions>(
  items: MathItem[],
  options?: T
): (PartialScene & T) | PartialScene {
  const folder = makeItem(MathItemType.Folder);
  const scene: PartialScene = {
    items: [folder, ...items],
    itemOrder: {
      main: [folder.id],
      [folder.id]: items.map((item) => item.id),
      setup: [],
    },
  };
  if (options) {
    return { ...scene, ...options };
  }
  return scene;
}

export { makeSceneFromItems };
