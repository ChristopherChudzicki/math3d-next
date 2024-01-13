import { MathItem, MathItemType } from "@math3d/mathitem-configs";
import type { PartialBy } from "@math3d/utils";
import type { Scene } from "@/types";
import { faker } from "@faker-js/faker/locale/en";
import { makeItem } from "../factories";

type PartialScene = PartialBy<Scene, "title" | "key">;

function makeSceneFromItems(
  items: MathItem[],
  options?: Partial<Omit<Scene, "items" | "itemOrder">>,
): Scene {
  const folder = makeItem(MathItemType.Folder);
  return {
    items: [folder, ...items],
    itemOrder: {
      main: [folder.id],
      [folder.id]: items.map((item) => item.id),
      setup: [],
    },
    title: faker.lorem.words(),
    createdDate: faker.date.past().toISOString(),
    modifiedDate: faker.date.past().toISOString(),
    key: faker.datatype.uuid(),
    ...options,
  };
}

export { makeSceneFromItems };
