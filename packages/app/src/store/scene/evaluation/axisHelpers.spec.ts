import { CyclicAssignmentError } from "@math3d/mathscope";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";

const assignment = (lhs: string, rhs: string) => ({
  type: "assignment" as const,
  lhs,
  rhs,
});

/**
 * A store whose scene holds variables `a = 2` (id "a") and `r = <rhs>`
 * (id "r"), with the z axis running from -5 to 5.
 */
const setup = (rhs: string) => {
  const scene = new SceneBuilder();
  scene.axis("z", { min: "-5", max: "5" });
  scene
    .folder()
    .variable({ value: assignment("a", "2") }, "a")
    .variable({ value: assignment("r", rhs) }, "r");
  const store = getStore();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  const scope = () => store.mathScope.get();
  const setAxisZ = (properties: { min?: string; max?: string }) =>
    store.dispatch(
      actions.setProperties({ id: "axis-z", type: MIT.Axis, properties }),
    );
  const setA = (value: string) =>
    store.dispatch(
      actions.setProperties({
        id: "a",
        type: MIT.Variable,
        properties: { value: assignment("a", value) },
      }),
    );
  return { store, scope, setAxisZ, setA };
};

test("rescale_z maps a value across the z axis's range", () => {
  const { scope } = setup("\\operatorname{rescale}_z(0)");
  expect(scope().results.get("r-value")).toBe(0.5);
});

test("z_min is the z axis's lower bound", () => {
  const { scope } = setup("z_{\\operatorname{min}}");
  expect(scope().results.get("r-value")).toBe(-5);
});

test("rescale_z follows an axis bound that depends on a variable", () => {
  const { scope, setAxisZ, setA } = setup("\\operatorname{rescale}_z(4)");
  setAxisZ({ max: "a" });
  expect(scope().results.get("r-value")).toBeGreaterThan(1);
  setA("4");
  expect(scope().results.get("r-value")).toBe(1);
});

test.each([
  { max: "5+", failure: "doesn't parse" },
  { max: "q", failure: "doesn't evaluate" },
])("rescale_z is undefined while an axis bound $failure", ({ max }) => {
  const { scope, setAxisZ } = setup("\\operatorname{rescale}_z(0)");
  setAxisZ({ max });
  expect(scope().results.has("r-value")).toBe(false);
  expect(scope().errors.has("r-value")).toBe(true);
});

test("an axis bound defined through its own name is a cycle", () => {
  const { scope, setAxisZ } = setup("1");
  setAxisZ({ max: "z_{\\operatorname{max}}+1" });
  expect(scope().errors.get("axis-z-max")).toBeInstanceOf(
    CyclicAssignmentError,
  );
});

test("a user's x_min wins, while rescale_x still follows the axis", () => {
  const { store, scope } = setup("\\operatorname{rescale}_x(0)");
  store.dispatch(actions.addNewItem({ type: MIT.Variable }));
  const userId = Object.values(store.getState().scene.items).find(
    (item) => item.type === MIT.Variable && !["a", "r"].includes(item.id),
  )?.id;
  if (!userId) throw new Error("expected a new variable");
  store.dispatch(
    actions.setProperties({
      id: userId,
      type: MIT.Variable,
      properties: { value: assignment("x_{\\operatorname{min}}", "100") },
    }),
  );
  expect(scope().results.get(`${userId}-value`)).toBe(100);
  expect(scope().evalScope.get("x_min")).toBe(100);
  expect(scope().results.get("r-value")).toBe(0.5);
  expect(scope().errors).toEqual(new Map());
});
