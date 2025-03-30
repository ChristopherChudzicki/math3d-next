import { cloneDeep } from "lodash-es";
import { factory, primaryKey, nullable } from "@mswjs/data";
import { faker } from "@faker-js/faker";
import { MathItem } from "@math3d/mathitem-configs";
import type { StrictScene as Scene, User } from "@math3d/api";

import { makeSceneFromItems } from "./factories";
import { sceneFixtures } from "./fixtures";

const db = factory({
  scene: {
    key: primaryKey(faker.string.uuid),
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
    author: nullable(faker.number.int),
    archived: faker.datatype.boolean,
    createdDate: () => faker.date.recent().toUTCString(),
    modifiedDate: () => faker.date.recent().toUTCString(),
  },
  user: {
    id: primaryKey(faker.number.int),
    public_nickname: faker.internet.username,
    email: faker.internet.email,
    password: faker.internet.password,
    auth_token: faker.string.uuid,
  },
});

type UserWithPassword = User & {
  // Real API response does not include password/token, of course, but we need it for
  // the msw model & handler.
  password: string;
  auth_token: string;
};

const addUser = (user?: Partial<UserWithPassword>): UserWithPassword => {
  const created = db.user.create(user);
  return created;
};

type SceneRecord = Scene;

/**
 * A wrapper around `db.scene.create` to fix some ts issues.
 */
const addScene = (scene?: Partial<SceneRecord>): Scene => {
  const { itemOrder } = scene ?? {};

  // @ts-expect-error Having trouble with msw types
  const created = db.scene.create({
    ...scene,
    ...(itemOrder ? { itemOrder: JSON.stringify(itemOrder) } : {}),
  });
  const copy = cloneDeep(created);
  const theScene: Scene = {
    ...copy,
    itemOrder: JSON.parse(copy.itemOrder),
  };
  return theScene;
};

const seedDb = {
  withFixtures: (): void => {
    Object.values(sceneFixtures).forEach((f) => addScene(f()));
  },
  withScene: addScene,
  withScenes(count: number, overrides?: Partial<SceneRecord>): Scene[] {
    const scenes = Array.from({ length: count });
    return scenes.map(() => addScene(overrides));
  },
  /**
   * Create a schene with given items in a single folder, in the given order
   */
  withSceneFromItems: (items: MathItem[], { key }: { key?: string } = {}) => {
    const scene = makeSceneFromItems(items, { key });
    return addScene(scene);
  },
  withUser: addUser,
};

seedDb.withFixtures();

type SeedDb = typeof seedDb;

export default db;

export type { SeedDb };

export { seedDb };
