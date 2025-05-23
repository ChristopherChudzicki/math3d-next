/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  MathItem,
  mathItemConfigs,
  MathItemType,
} from "@math3d/mathitem-configs";
import type {
  StrictScene as IScene,
  UserCreatePasswordRetypeRequest,
} from "@math3d/api";
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
    key: faker.string.uuid(),
    createdDate: faker.date.past().toISOString(),
    modifiedDate: faker.date.past().toISOString(),
    author: null,
    archived: false,
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
    this.author = null;
    this.title = opts.title ?? faker.lorem.words();
    this.key = opts.key ?? faker.string.uuid();
    this.createdDate = opts.createdDate ?? faker.date.past().toISOString();
    this.modifiedDate =
      opts.modifiedDate ??
      faker.date
        .between({ from: this.createdDate, to: new Date().toISOString() })
        .toISOString();
    this.archived = opts.archived ?? false;

    if (setup) {
      this.#setupFolder();
    }
  }

  author: number | null;

  folder(
    opts?: Partial<MathItem<MathItemType.Folder>["properties"]>,
    id?: string,
  ) {
    return new Folder(this, "main", opts, id);
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
      { axes: "xy", visible: true },
      ids.gridXY,
    );
    const gridYZ = makeItem(
      MathItemType.Grid,
      { axes: "yz", visible: false },
      ids.gridYZ,
    );
    const gridZX = makeItem(
      MathItemType.Grid,
      { axes: "zx", visible: false },
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
      archived: this.archived,
      author: this.author,
    };
  }
}

const addItemToScene = (
  scene: SceneBuilder,
  parentId: string,
  item: MathItem,
) => {
  invariant(scene.itemOrder[parentId], `Parent folder "${parentId}" not found`);
  invariant(
    !scene.items.find((x) => x.id === item.id),
    `Item with id "${item.id}" already exists`,
  );
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
    id?: string,
  ) {
    this.#scene = scene;

    // Add the folder itself to the scene
    const item = makeItem(
      MathItemType.Folder,
      opts,
      id ?? getNextId(this.#scene),
    );
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

  axis(
    opts: Partial<MathItem<MathItemType.Axis>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.Axis, opts, id ?? getNextId(this.#scene)),
    );
  }

  booleanVariable(
    opts: Partial<MathItem<MathItemType.BooleanVariable>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(
        MathItemType.BooleanVariable,
        opts,
        id ?? getNextId(this.#scene),
      ),
    );
  }

  camera(
    opts: Partial<MathItem<MathItemType.Camera>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.Camera, opts, id ?? getNextId(this.#scene)),
    );
  }

  explicitSurface(
    opts: Partial<MathItem<MathItemType.ExplicitSurface>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(
        MathItemType.ExplicitSurface,
        opts,
        id ?? getNextId(this.#scene),
      ),
    );
  }

  explicitSurfacePolar(
    opts: Partial<
      MathItem<MathItemType.ExplicitSurfacePolar>["properties"]
    > = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(
        MathItemType.ExplicitSurfacePolar,
        opts,
        id ?? getNextId(this.#scene),
      ),
    );
  }

  grid(
    opts: Partial<MathItem<MathItemType.Grid>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.Grid, opts, id ?? getNextId(this.#scene)),
    );
  }

  implicitSurface(
    opts: Partial<MathItem<MathItemType.ImplicitSurface>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(
        MathItemType.ImplicitSurface,
        opts,
        id ?? getNextId(this.#scene),
      ),
    );
  }

  line(
    opts: Partial<MathItem<MathItemType.Line>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.Line, opts, id ?? getNextId(this.#scene)),
    );
  }

  parametricCurve(
    opts: Partial<MathItem<MathItemType.ParametricCurve>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(
        MathItemType.ParametricCurve,
        opts,
        id ?? getNextId(this.#scene),
      ),
    );
  }

  parametricSurface(
    opts: Partial<MathItem<MathItemType.ParametricSurface>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(
        MathItemType.ParametricSurface,
        opts,
        id ?? getNextId(this.#scene),
      ),
    );
  }

  point(
    opts: Partial<MathItem<MathItemType.Point>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.Point, opts, id ?? getNextId(this.#scene)),
    );
  }

  variable(
    opts: Partial<MathItem<MathItemType.Variable>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.Variable, opts, id ?? getNextId(this.#scene)),
    );
  }

  variableSlider(
    opts: Partial<MathItem<MathItemType.VariableSlider>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.VariableSlider, opts, id ?? getNextId(this.#scene)),
    );
  }

  vector(
    opts: Partial<MathItem<MathItemType.Vector>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.Vector, opts, id ?? getNextId(this.#scene)),
    );
  }

  vectorField(
    opts: Partial<MathItem<MathItemType.VectorField>["properties"]> = {},
    id?: string,
  ) {
    return this.#add(
      makeItem(MathItemType.VectorField, opts, id ?? getNextId(this.#scene)),
    );
  }
}

const DEFAULT_EMAIL_PROVIDER =
  import.meta?.env?.TEST_EMAIL_PROVIDER ?? process.env.TEST_EMAIL_PROVIDER;
const makeUserInfo = (
  info?: UserCreatePasswordRetypeRequest,
): UserCreatePasswordRetypeRequest => {
  const password = faker.internet.password();

  return {
    email: faker.internet.email({ provider: DEFAULT_EMAIL_PROVIDER }),
    password,
    re_password: password,
    public_nickname: faker.person.firstName(),
    ...info,
  };
};

export { makeItem, makeSceneFromItems, SceneBuilder, makeUserInfo };
