import {
  MathItem,
  mathItemConfigs,
  MathItemType,
} from "@math3d/mathitem-configs";
import type { StrictScene as Scene } from "@math3d/api";
import { faker } from "@faker-js/faker/locale/en";
import { uniqueId } from "lodash-es";

const makeItem = <T extends MathItemType>(
  type: T,
  props: Partial<MathItem<T>["properties"]> = {},
  id = uniqueId(),
): MathItem<T> => {
  const item = mathItemConfigs[type].make(id) as MathItem<T>;
  item.properties = {
    ...item.properties,
    ...props,
  };
  return item;
};

const makeSceneFromItems = (
  items: MathItem[],
  sceneProps: Partial<Omit<Scene, "items" | "itemOrder">> = {},
) => {
  const folder = makeItem(MathItemType.Folder);
  const scene: Scene = {
    items: [folder, ...items].sort((a, b) => a.id.localeCompare(b.id)),
    itemOrder: {
      main: [folder.id],
      [folder.id]: items.map((item) => item.id),
      setup: [],
    },
    title: faker.lorem.words(),
    key: faker.datatype.uuid(),
    createdDate: faker.date.past().toISOString(),
    modifiedDate: faker.date.past().toISOString(),
    ...sceneProps,
  };
  return scene;
};

export { makeItem, makeSceneFromItems };
