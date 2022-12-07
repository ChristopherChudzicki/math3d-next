import { MathItemType as MIT } from "@/configs";
import {
  makeItem,
  nodeId,
  renderTestApp,
  screen,
  seedDb,
  user,
  within,
} from "@/test_util";
import { getItemByDescription } from "./__utils__";

test("left-hand parse errors are indicated on left-hand side", async () => {
  const variable = makeItem(MIT.BooleanVariable, {
    value: { lhs: "a+", rhs: "123", type: "assignment" },
  });
  const scene = seedDb.withSceneFromItems([variable]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const mathScope = store.getState().mathItems.mathScope();
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
  const { store } = await renderTestApp(`/${scene.id}`);
  const mathScope = store.getState().mathItems.mathScope();
  const form = getItemByDescription("Test Switch");
  const switchEl = await within(form).findByLabelText("Value");
  const checkboxEl = within(switchEl).getByRole("checkbox");

  expect(mathScope.results.get(id("value"))).toBe(true);
  await user.click(checkboxEl);
  expect(mathScope.results.get(id("value"))).toBe(false);
  await user.click(checkboxEl);
  expect(mathScope.results.get(id("value"))).toBe(true);
});
