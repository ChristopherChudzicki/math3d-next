import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { renderTestApp, screen } from "@/test_util";
import { seedDb, makeItem } from "@math3d/mock-api";

test("left-hand parse errors are indicated on left-hand side", async () => {
  const variable = makeItem(MIT.Variable, {
    value: { lhs: "a+", rhs: "123", type: "assignment" },
  });
  const scene = seedDb.withSceneFromItems([variable]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().mathItems.mathScope();
  expect(mathScope.errors.size).toBe(1);
  const lhs = await screen.findByLabelText("left-hand side", { exact: false });
  const rhs = await screen.findByLabelText("right-hand side", { exact: false });
  expect(lhs).toHaveClass("has-error");
  expect(rhs).not.toHaveClass("has-error");
});

test("right-hand parse errors are indicated on right-hand side", async () => {
  const variable = makeItem(MIT.Variable, {
    value: { lhs: "a", rhs: "123 + ", type: "assignment" },
  });
  const scene = seedDb.withSceneFromItems([variable]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().mathItems.mathScope();
  expect(mathScope.errors.size).toBe(1);
  const lhs = await screen.findByLabelText("left-hand side", { exact: false });
  const rhs = await screen.findByLabelText("right-hand side", { exact: false });
  expect(lhs).not.toHaveClass("has-error");
  expect(rhs).toHaveClass("has-error");
});
