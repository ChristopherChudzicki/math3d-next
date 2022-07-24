import { MathItemType as MIT } from "configs";
import { IntegrationTest, makeItem, screen } from "test_util";

test("left-hand parse errors are indicated on left-hand side", async () => {
  const variable = makeItem(MIT.Variable, { value: "a+ = 123" });
  const helper = new IntegrationTest();
  helper.patchMathItemsInFolder([variable]);
  const { store } = helper.render();

  const mathScope = store.getState().mathItems.mathScope();
  expect(mathScope.parseErrors.size).toBe(1);
  const lhs = await screen.findByTitle("left-hand side", { exact: false });
  const rhs = await screen.findByTitle("right-hand side", { exact: false });
  expect(lhs).toHaveClass("has-error");
  expect(rhs).not.toHaveClass("has-error");
});

test("right-hand parse errors are indicated on right-hand side", async () => {
  const variable = makeItem(MIT.Variable, { value: "a = 123 + " });
  const helper = new IntegrationTest();
  helper.patchMathItemsInFolder([variable]);
  const { store } = helper.render();

  const mathScope = store.getState().mathItems.mathScope();
  expect(mathScope.parseErrors.size).toBe(1);
  const lhs = await screen.findByTitle("left-hand side", { exact: false });
  const rhs = await screen.findByTitle("right-hand side", { exact: false });
  expect(lhs).not.toHaveClass("has-error");
  expect(rhs).toHaveClass("has-error");
});
