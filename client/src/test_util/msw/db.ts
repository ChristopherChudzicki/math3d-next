import type { PartialBy, Scene } from "types";
import { factory, primaryKey } from "@mswjs/data";
import { faker } from "@faker-js/faker";

const db = factory({
  scene: {
    id: primaryKey(faker.random.alphaNumeric),
    title: faker.lorem.sentence,
    items: () => [],
    // @ts-expect-error unsure how to define a directionary in model
    itemOrder: () => ({}),
  },
});

const addScene = (scene: PartialBy<Scene, "title" | "id">) => {
  return db.scene.create(scene);
};

addScene({
  id: "cat",
  items: [],
  itemOrder: {},
});

export default db;
