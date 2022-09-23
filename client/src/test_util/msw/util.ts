import { MathItem, MathItemType } from "@/configs";
import { PartialBy, Scene } from "@/types";
import { T } from "vitest/dist/global-ea084c9f";
import { makeItem } from "../makeItem";

type PartialScene = PartialBy<Scene, "title" | "id">;

type SceneOptions = Partial<Pick<Scene, "id" | "title">>;

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
