import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathGraphic, MathItem } from "@math3d/mathitem-configs";
import { makeItem, seedDb } from "@math3d/mock-api";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";

const variable = (lhs: string, rhs: string) =>
  makeItem(MIT.Variable, { value: { lhs, rhs, type: "assignment" } });

/** A store holding `driver`, and a point set by hand despite `calculatedVisibility`. */
const setup = (driver: MathItem, calculatedVisibility: string) => {
  const point = makeItem(MIT.Point, {
    calculatedVisibility,
    useCalculatedVisibility: false,
  });
  const store = getStore();
  const load = (items: MathItem[]) => {
    const scene = seedDb.withSceneFromItems(items);
    store.dispatch(
      actions.setScene({
        key: scene.key,
        author: null,
        items: scene.items,
        order: scene.itemOrder,
        title: "",
        isLegacy: false,
      }),
    );
  };
  load([driver, point]);
  const setDriver = (rhs: string, clean?: boolean) =>
    store.dispatch(
      actions.setProperties(
        {
          id: driver.id,
          type: driver.type,
          properties: {
            value: { lhs: "a", rhs, type: "assignment" },
          },
        },
        clean,
      ),
    );
  const following = () =>
    (store.getState().scene.items[point.id] as MathGraphic).properties
      .useCalculatedVisibility;
  return { store, load, point, setDriver, following };
};

test.each(["true", "false"])(
  "a manual item follows its expression again once a toggle it reads flips (from %s)",
  (start) => {
    const toggle = makeItem(MIT.BooleanVariable, {
      value: { lhs: "a", rhs: start, type: "assignment" },
    });
    const { setDriver, following } = setup(toggle, "a");
    expect(following()).toBe(false);

    setDriver(start === "true" ? "false" : "true");

    expect(following()).toBe(true);
  },
);

test("a change that leaves the expression's value alone keeps it manual", () => {
  const { setDriver, following } = setup(variable("a", "5"), "a>2");

  setDriver("6");

  expect(following()).toBe(false);
});

test("an error on the way doesn't count; the value it settles on does", () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  const { setDriver, following } = setup(variable("a", "5"), "a>2");

  setDriver("5+");
  setDriver("6");
  expect(following()).toBe(false);

  setDriver("5+");
  setDriver("1");
  expect(following()).toBe(true);
});

test("loading a scene that reuses ids and values differ leaves it manual", () => {
  const driver = variable("a", "5");
  const { load, point, following } = setup(driver, "a>2");

  load([{ ...variable("a", "1"), id: driver.id }, point]);

  expect(following()).toBe(false);
});

test("relinking after a clean change leaves the scene clean", () => {
  const { store, setDriver, following } = setup(variable("a", "5"), "a>2");

  setDriver("1", /* clean */ true);

  expect(following()).toBe(true);
  expect(store.getState().scene.dirty).toBe(false);
});
