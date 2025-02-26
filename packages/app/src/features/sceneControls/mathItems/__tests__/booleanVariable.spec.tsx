import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { nodeId, renderTestApp, screen, user, within } from "@/test_util";
import { seedDb, makeItem } from "@math3d/mock-api";
import { getItemByDescription } from "./__utils__";

test("left-hand parse errors are indicated on left-hand side", async () => {
  const variable = makeItem(MIT.BooleanVariable, {
    value: { lhs: "a+", rhs: "123", type: "assignment" },
  });
  const scene = seedDb.withSceneFromItems([variable]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const mathScope = store.getState().scene.mathScope();
  expect(mathScope.errors.size).toBe(1);
  const lhs = await screen.findByLabelText("Switch name", {
    exact: false,
  });
  expect(lhs).toHaveClass("has-error");
});

test("Clicking switch on Boolean variable toggles value", async () => {
  const variable = makeItem(MIT.BooleanVariable, {
    value: { lhs: "a", rhs: "true", type: "assignment" },
    description: "Test Switch",
  });
  const scene = seedDb.withSceneFromItems([variable]);
  const id = nodeId(variable);
  const { store } = await renderTestApp(`/${scene.key}`);
  const mathScope = store.getState().scene.mathScope();
  const form = getItemByDescription("Test Switch");
  const checkboxEl = await within(form).findByRole("checkbox", {
    name: "Value",
  });

  expect(mathScope.results.get(id("value"))).toBe(true);
  await user.click(checkboxEl);
  expect(mathScope.results.get(id("value"))).toBe(false);
  await user.click(checkboxEl);
  expect(mathScope.results.get(id("value"))).toBe(true);
});
