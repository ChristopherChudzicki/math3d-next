/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  MathItem,
  mathItemConfigs,
  MathItemType,
} from "@math3d/mathitem-configs";
import type { StrictScene as IScene } from "@math3d/api";
import { faker } from "@faker-js/faker/locale/en";
import { uniqueId } from "lodash-es";
import invariant from "tiny-invariant";

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
  sceneProps: Partial<Omit<IScene, "items" | "itemOrder">> = {},
) => {
  const folder = makeItem(MathItemType.Folder);
  const scene: IScene = {
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

const SceneIds = new WeakMap<SceneBuilder, number>();
const getNextId = (scene: SceneBuilder): string => {
  const id = SceneIds.get(scene) ?? 0;
  SceneIds.set(scene, id + 1);
  return String(id);
};

class SceneBuilder implements IScene {
  items: MathItem[] = [];

  itemOrder: Record<string, string[]> = {
    main: [],
    setup: [],
  };

  title: string;

  key: string;

  createdDate: string;

  modifiedDate: string;

  archived: boolean;

  constructor(
    opts: Partial<IScene> = {},
    { setup = true }: { setup?: boolean } = {},
  ) {
    this.title = opts.title ?? faker.lorem.words();
    this.key = opts.key ?? faker.datatype.uuid();
    this.createdDate = opts.createdDate ?? faker.date.past().toISOString();
    this.modifiedDate =
      opts.modifiedDate ??
      faker.date
        .between(this.createdDate, new Date().toISOString())
        .toISOString();
    this.archived = opts.archived ?? false;

    if (setup) {
      this.#setupFolder();
    }
  }

  author: number;

  archived: boolean;

  folder(opts?: Partial<MathItem<MathItemType.Folder>["properties"]>) {
    return new Folder(this, "main", opts);
  }

  #ids = {
    mainFolder: "main",
    setupFolder: "setup",
    camera: "camera",
    cameraFolder: "cameraFolder",
    axesFolder: "axes",
    axisX: "axis-x",
    axisY: "axis-y",
    axisZ: "axis-z",
    gridXY: "grid-xy",
    gridYZ: "grid-yz",
    gridZX: "grid-zx",
  };

  #setupFolder() {
    const ids = this.#ids;
    const cameraFolder = makeItem(
      MathItemType.Folder,
      {
        description: "Camera Controls",
      },
      ids.cameraFolder,
    );
    addItemToScene(this, ids.setupFolder, cameraFolder);
    const camera = makeItem(MathItemType.Camera, {}, ids.camera);
    addItemToScene(this, ids.cameraFolder, camera);

    const axesFolder = makeItem(
      MathItemType.Folder,
      {
        description: "Axes and Grids",
      },
      ids.axesFolder,
    );

    addItemToScene(this, ids.setupFolder, axesFolder);
    const axisX = makeItem(MathItemType.Axis, { axis: "x" }, ids.axisX);
    const axisY = makeItem(MathItemType.Axis, { axis: "y" }, ids.axisY);
    const axisZ = makeItem(
      MathItemType.Axis,
      { axis: "z", scale: "1/2" },
      ids.axisZ,
    );
    const gridXY = makeItem(
      MathItemType.Grid,
      { axes: "xy", visible: "true" },
      ids.gridXY,
    );
    const gridYZ = makeItem(
      MathItemType.Grid,
      { axes: "yz", visible: "false" },
      ids.gridYZ,
    );
    const gridZX = makeItem(
      MathItemType.Grid,
      { axes: "zx", visible: "false" },
      ids.gridZX,
    );
    addItemToScene(this, ids.axesFolder, axisX);
    addItemToScene(this, ids.axesFolder, axisY);
    addItemToScene(this, ids.axesFolder, axisZ);
    addItemToScene(this, ids.axesFolder, gridXY);
    addItemToScene(this, ids.axesFolder, gridYZ);
    addItemToScene(this, ids.axesFolder, gridZX);
  }

  camera(opts?: Partial<MathItem<MathItemType.Camera>["properties"]>) {
    const item = this.items.find((x) => x.id === this.#ids.camera);
    invariant(item, "Camera not found");
    item.properties = { ...item.properties, ...opts };
    return this;
  }

  axis(
    axis: "x" | "y" | "z",
    opts?: Partial<MathItem<MathItemType.Axis>["properties"]>,
  ) {
    const id = {
      x: this.#ids.axisX,
      y: this.#ids.axisY,
      z: this.#ids.axisZ,
    }[axis];
    const item = this.items.find((x) => x.id === id);
    invariant(item, "Axis not found");
    item.properties = { ...item.properties, ...opts };
    return this;
  }

  grid(
    axes: "xy" | "yz" | "zx",
    opts?: Partial<MathItem<MathItemType.Grid>["properties"]>,
  ) {
    const id = {
      xy: this.#ids.gridXY,
      yz: this.#ids.gridYZ,
      zx: this.#ids.gridZX,
    }[axes];
    const item = this.items.find((x) => x.id === id);
    invariant(item, "Grid not found");
    item.properties = { ...item.properties, ...opts };
    return this;
  }

  json(): IScene {
    return {
      title: this.title,
      key: this.key,
      createdDate: this.createdDate,
      modifiedDate: this.modifiedDate,
      items: this.items,
      itemOrder: this.itemOrder,
    };
  }
}

const addItemToScene = (
  scene: SceneBuilder,
  parentId: string,
  item: MathItem,
) => {
  invariant(scene.itemOrder[parentId], `Parent folder "${parentId}" not found`);
  scene.items.push(item);
  scene.itemOrder[parentId].push(item.id);
  if (item.type === MathItemType.Folder) {
    // eslint-disable-next-line no-param-reassign
    scene.itemOrder[item.id] = [];
  }
};

class Folder {
  #scene: SceneBuilder;

  #item: MathItem<MathItemType.Folder>;

  constructor(
    scene: SceneBuilder,
    parentId: string,
    opts: Partial<MathItem<MathItemType.Folder>["properties"]> = {},
  ) {
    this.#scene = scene;

    // Add the folder itself to the scene
    const item = makeItem(MathItemType.Folder, opts, getNextId(this.#scene));
    addItemToScene(this.#scene, parentId, item);
    this.#item = item;
  }

  #add(item: MathItem) {
    invariant(
      item.type !== MathItemType.Folder,
      "Cannot add a folder to a folder",
    );
    addItemToScene(this.#scene, this.#item.id, item);
    return this;
  }

  axis(opts: Partial<MathItem<MathItemType.Axis>["properties"]> = {}) {
    return this.#add(makeItem(MathItemType.Axis, opts, getNextId(this.#scene)));
  }

  booleanVariable(
    opts: Partial<MathItem<MathItemType.BooleanVariable>["properties"]> = {},
  ) {
    return this.#add(
      makeItem(MathItemType.BooleanVariable, opts, getNextId(this.#scene)),
    );
  }

  camera(opts: Partial<MathItem<MathItemType.Camera>["properties"]> = {}) {
    return this.#add(
      makeItem(MathItemType.Camera, opts, getNextId(this.#scene)),
    );
  }

  explicitSurface(
    opts: Partial<MathItem<MathItemType.ExplicitSurface>["properties"]> = {},
  ) {
    return this.#add(
      makeItem(MathItemType.ExplicitSurface, opts, getNextId(this.#scene)),
    );
  }

  explicitSurfacePolar(
    opts: Partial<
      MathItem<MathItemType.ExplicitSurfacePolar>["properties"]
    > = {},
  ) {
    return this.#add(
      makeItem(MathItemType.ExplicitSurfacePolar, opts, getNextId(this.#scene)),
    );
  }

  grid(opts: Partial<MathItem<MathItemType.Grid>["properties"]> = {}) {
    return this.#add(makeItem(MathItemType.Grid, opts, getNextId(this.#scene)));
  }

  implicitSurface(
    opts: Partial<MathItem<MathItemType.ImplicitSurface>["properties"]> = {},
  ) {
    return this.#add(
      makeItem(MathItemType.ImplicitSurface, opts, getNextId(this.#scene)),
    );
  }

  line(opts: Partial<MathItem<MathItemType.Line>["properties"]> = {}) {
    return this.#add(makeItem(MathItemType.Line, opts, getNextId(this.#scene)));
  }

  parametricCurve(
    opts: Partial<MathItem<MathItemType.ParametricCurve>["properties"]> = {},
  ) {
    return this.#add(
      makeItem(MathItemType.ParametricCurve, opts, getNextId(this.#scene)),
    );
  }

  parametricSurface(
    opts: Partial<MathItem<MathItemType.ParametricSurface>["properties"]> = {},
  ) {
    return this.#add(
      makeItem(MathItemType.ParametricSurface, opts, getNextId(this.#scene)),
    );
  }

  point(opts: Partial<MathItem<MathItemType.Point>["properties"]> = {}) {
    return this.#add(
      makeItem(MathItemType.Point, opts, getNextId(this.#scene)),
    );
  }

  variable(opts: Partial<MathItem<MathItemType.Variable>["properties"]> = {}) {
    return this.#add(
      makeItem(MathItemType.Variable, opts, getNextId(this.#scene)),
    );
  }

  variableSlider(
    opts: Partial<MathItem<MathItemType.VariableSlider>["properties"]> = {},
  ) {
    return this.#add(
      makeItem(MathItemType.VariableSlider, opts, getNextId(this.#scene)),
    );
  }

  vector(opts: Partial<MathItem<MathItemType.Vector>["properties"]> = {}) {
    return this.#add(
      makeItem(MathItemType.Vector, opts, getNextId(this.#scene)),
    );
  }

  vectorField(
    opts: Partial<MathItem<MathItemType.VectorField>["properties"]> = {},
  ) {
    return this.#add(
      makeItem(MathItemType.VectorField, opts, getNextId(this.#scene)),
    );
  }
}

export { makeItem, makeSceneFromItems, SceneBuilder };
