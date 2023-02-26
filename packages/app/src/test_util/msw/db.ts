import type { PartialBy, Scene } from "@/types";
import { factory, primaryKey } from "@mswjs/data";
import { faker } from "@faker-js/faker";
import { MathItem, MathItemType } from "@/configs";
import { makeItem } from "../makeItem";
import { sceneFixtures } from "./fixtures";

const db = factory({
  scene: {
    id: primaryKey(faker.datatype.uuid),
    title: faker.lorem.sentence,
    items: () => [],
    /**
     * This is a string because @mswjs/data does not have great support for
     * unstructured data at the moment.
     *
     * So this factory uses a stringified itemOrder, and the msw handler will
     * parse it (and re-stringify the whole body).
     */
    itemOrder: () => JSON.stringify({}),
  },
});

type PartialScene = PartialBy<Scene, "title" | "id">;

/**
 * A wrapper around `db.scene.create` to fix some ts issues.
 */
const addScene = (scene: PartialScene): Scene => {
  const { itemOrder } = scene;
  // @ts-expect-error Having trouble with mswjs/data factory types
  return db.scene.create({
    ...scene,
    ...(itemOrder ? { itemOrder: JSON.stringify(itemOrder) } : {}),
  });
};

const seedDb = {
  withFixtures: (): void => {
    sceneFixtures.forEach((f) => addScene(f()));
  },
  withScene: addScene,
  /**
   * Create a schene with given items in a single folder, in the given order
   */
  withSceneFromItems: (items: MathItem[], { id }: { id?: string } = {}) => {
    const folder = makeItem(MathItemType.Folder);
    const scene: PartialScene = {
      items: [folder, ...items],
      itemOrder: {
        main: [folder.id],
        [folder.id]: items.map((item) => item.id),
        setup: [],
      },
    };
    if (id) {
      scene.id = id;
    }
    return addScene(scene);
  },
};

seedDb.withFixtures();

type SeedDb = typeof seedDb;

export default db;

export type { SeedDb };

export { seedDb };
