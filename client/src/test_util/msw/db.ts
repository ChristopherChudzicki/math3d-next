import type { PartialBy, Scene } from "types";
import { factory, primaryKey } from "@mswjs/data";
import { faker } from "@faker-js/faker";
import { MathItem, MathItemType } from "configs";
import { makeItem } from "features/sceneControls/mathItems/util";
import { makeFolderScene } from "./fixtures";

const db = factory({
  scene: {
    id: primaryKey(faker.random.alphaNumeric),
    title: faker.lorem.sentence,
    items: () => [],
    // @ts-expect-error unsure how to define a directionary in model
    itemOrder: () => ({}),
  },
});

type PartialScene = PartialBy<Scene, "title" | "id">;

/**
 * A wrapper around `db.scene.create` to fix some ts issues.
 */
const addScene = (scene: PartialScene): Scene => {
  // @ts-expect-error Having trouble with mswjs/data factory types
  return db.scene.create(scene);
};

const seedDb = {
  withFixtures: (): void => {
    addScene(makeFolderScene());
  },
  withScene: addScene,
  /**
   * Create a schene with given items in a single folder, in the given order
   */
  withSceneFromItems: (items: MathItem[]) => {
    const folder = makeItem(MathItemType.Folder);
    const scene: PartialScene = {
      items: [folder, ...items],
      itemOrder: {
        main: [folder.id],
        [folder.id]: items.map((item) => item.id),
        setup: [],
      },
    };
    return addScene(scene);
  },
};

export default db;

export { seedDb };
