import { MathItem, MathItemType as MIT } from "@math3d/mathitem-configs";
import { faker } from "@faker-js/faker/locale/en";
import type { StrictScene as Scene } from "@math3d/api";

import { makeItem, makeSceneFromItems } from "./factories";

const sceneKeys = {
  /**
   * A scene with 6 points distributed between 3 folders using labels:
   * - folder `"F1"` with points `["P1a", "P1b"]`
   * - folder `"F2"` with points `["P2a", "P2b"]`
   * - folder `"F3"` with points `["P3a", "P3b"]`
   */
  testFolders: "test_folders",
  /**
   * A scene with 6 points distributed between 3 folders using labels:
   * - folder `"F1"` with points `["P1a", "P1b"]`
   * - folder `"F2"` with points `["P2a", "P2b"]` initially collapsed
   * - folder `"F3"` with points `["P3a", "P3b"]`
   */
  testFoldersF2Collapsed: "test_folders_F2_collapsed",
  slider: "slider",
} as const;

const makeFolderScene = (
  sceneKey: string,
  {
    F1 = {},
    F2 = {},
    F3 = {},
  }: {
    F1?: Partial<MathItem<MIT.Folder>["properties"]>;
    F2?: Partial<MathItem<MIT.Folder>["properties"]>;
    F3?: Partial<MathItem<MIT.Folder>["properties"]>;
  } = {},
): Scene => {
  const folderProps = { F1, F2, F3 };
  const pointDescriptions = ["P1a", "P1b", "P2a", "P2b", "P3a", "P3b"];
  const folderDescriptions = ["F1", "F2", "F3"] as const;
  const points = pointDescriptions.map((description) =>
    makeItem(MIT.Point, { description }),
  );
  const folders = folderDescriptions.map((description) =>
    makeItem(MIT.Folder, { description, ...folderProps[description] }),
  );
  const items = [...points, ...folders];
  const [p0, p1, p2, p3, p4, p5] = points.map((p) => p.id);
  const [f0, f1, f2] = folders.map((f) => f.id);
  return {
    key: sceneKey,
    isLegacy: false,
    title: "Test data for folders",
    items,
    itemOrder: {
      setup: [],
      main: [f0, f1, f2],
      [f0]: [p0, p1],
      [f1]: [p2, p3],
      [f2]: [p4, p5],
    },
    createdDate: faker.date.past().toISOString(),
    modifiedDate: faker.date.past().toISOString(),
    author: null,
    archived: false,
  };
};

const makeSliderScene = () =>
  makeSceneFromItems([makeItem(MIT.VariableSlider)], {
    key: "slider",
    title: "Slider",
  });

type SceneFixture = () => Scene;

const sceneFixtures = {
  [sceneKeys.testFolders]: () => makeFolderScene(sceneKeys.testFolders),
  [sceneKeys.testFoldersF2Collapsed]: () =>
    makeFolderScene(sceneKeys.testFoldersF2Collapsed, {
      F2: { isCollapsed: "true" },
    }),
  [sceneKeys.slider]: makeSliderScene,
} satisfies Record<string, SceneFixture>;

export { sceneKeys, sceneFixtures };
