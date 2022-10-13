import { MathItemType as MIT } from "@/configs";
import { makeItem, renderTestApp, screen, seedDb } from "@/test_util";

test("left-hand parse errors are indicated on left-hand side", async () => {
  const variable = makeItem(MIT.Variable, { value: "a+ = 123" });
  const scene = seedDb.withSceneFromItems([variable]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const mathScope = store.getState().mathItems.mathScope();
  expect(mathScope.errors.size).toBe(1);
  const lhs = await screen.findByLabelText("left-hand side", { exact: false });
  const rhs = await screen.findByLabelText("right-hand side", { exact: false });
  expect(lhs).toHaveClass("has-error");
  expect(rhs).not.toHaveClass("has-error");
});

test("right-hand parse errors are indicated on right-hand side", async () => {
  const variable = makeItem(MIT.Variable, { value: "a = 123 + " });
  const scene = seedDb.withSceneFromItems([variable]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const mathScope = store.getState().mathItems.mathScope();
  expect(mathScope.errors.size).toBe(1);
  const lhs = await screen.findByLabelText("left-hand side", { exact: false });
  const rhs = await screen.findByLabelText("right-hand side", { exact: false });
  expect(lhs).not.toHaveClass("has-error");
  expect(rhs).toHaveClass("has-error");
});
