import { cloneDeep } from "lodash";
import type { PartialBy } from "@math3d/utils";
import { factory, primaryKey } from "@mswjs/data";
import { faker } from "@faker-js/faker";
import { MathItem, MathItemType } from "@math3d/mathitem-configs";
import type { Scene } from "@/types";
import { makeItem, sceneFromItems } from "../factories";
import { sceneFixtures } from "./fixtures";

const db = factory({
  scene: {
    key: primaryKey(faker.datatype.uuid),
    title: faker.lorem.sentence,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: () => [] as any[],
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

type PartialScene = PartialBy<Scene, "title" | "key">;

/**
 * A wrapper around `db.scene.create` to fix some ts issues.
 */
const addScene = (scene: PartialScene): Scene => {
  const { itemOrder } = scene;

  // @ts-expect-error Having trouble with msw types
  const created = db.scene.create({
    ...scene,
    ...(itemOrder ? { itemOrder: JSON.stringify(itemOrder) } : {}),
  });
  const copy = cloneDeep(created);
  copy.itemOrder = JSON.parse(copy.itemOrder);
  // @ts-expect-error Having trouble with msw types
  return copy as Scene;
};

const seedDb = {
  withFixtures: (): void => {
    Object.values(sceneFixtures).forEach((f) => addScene(f()));
  },
  withScene: addScene,
  /**
   * Create a schene with given items in a single folder, in the given order
   */
  withSceneFromItems: (items: MathItem[], { key }: { key?: string } = {}) => {
    const scene = sceneFromItems(items, { key });
    return addScene(scene);
  },
};

seedDb.withFixtures();

type SeedDb = typeof seedDb;

export default db;

export type { SeedDb };

export { seedDb };
