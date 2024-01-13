import {
  MathItem,
  mathItemConfigs,
  MathItemType,
} from "@math3d/mathitem-configs";
import idGenerator from "@/util/idGenerator";
import { Scene } from "@/types";
import { faker } from "@faker-js/faker/locale/en";

const makeItem = <T extends MathItemType>(
  type: T,
  props: Partial<MathItem<T>["properties"]> = {},
  id = idGenerator.next(),
): MathItem<T> => {
  const item = mathItemConfigs[type].make(id) as MathItem<T>;
  item.properties = {
    ...item.properties,
    ...props,
  };
  return item;
};

const sceneFromItems = (
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
    created_date: faker.date.past().toISOString(),
    modified_date: faker.date.past().toISOString(),
    ...sceneProps,
  };
  return scene;
};

export { makeItem, sceneFromItems };
