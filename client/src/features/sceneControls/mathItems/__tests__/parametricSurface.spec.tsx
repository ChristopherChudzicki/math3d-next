import { MathItem, MathItemType as MIT } from "configs";
import {
  assertInstanceOf,
  IntegrationTest,
  makeItem,
  nodeId,
  screen,
  user,
} from "test_util";
import { UnmetDependencyError } from "util/MathScope";

const getParamNameInputs = (): HTMLTextAreaElement[] => {
  const zeroth = screen.getByTitle("Name for 1st parameter");
  const first = screen.getByTitle("Name for 2nd parameter");
  assertInstanceOf(zeroth, HTMLTextAreaElement);
  assertInstanceOf(first, HTMLTextAreaElement);
  return [zeroth, first];
};

test.each([
  {
    expression: {
      initial: "_f(x,y)=[1+abc, 0, 0]",
      expectedFinal: "_f(abc,y)=[1+abc, 0, 0]",
    },
    evaluations: [
      { parmaValues: [1, 0], expectedOutput: [2, 0, 0] },
      { parmaValues: [0, 1], expectedOutput: [1, 0, 0] },
    ],
    param: { name: "abc", index: 0 },
  },
  {
    expression: {
      initial: "_f(x,y)=[1+abc, 0, 0]",
      expectedFinal: "_f(x,abc)=[1+abc, 0, 0]",
    },
    evaluations: [
      { parmaValues: [1, 0], expectedOutput: [1, 0, 0] },
      { parmaValues: [0, 1], expectedOutput: [2, 0, 0] },
    ],
    param: { name: "abc", index: 1 },
  },
])(
  "Updating parameter names to valid values updates expression appropriately",
  async ({ expression, param, evaluations }) => {
    const item = makeItem(MIT.ParametricSurface, { expr: expression.initial });
    const id = nodeId(item);
    const helper = new IntegrationTest();
    helper.patchMathItems([item]);
    const { mathScope, store } = helper.render();
    // initiall there is an error since the expr RHS contains "abc" which is not a param name or defined variable
    expect(mathScope.evalErrors.has(id("expr"))).toBe(true);
    const inputs = getParamNameInputs();
    await user.type(inputs[param.index], param.name);

    // assert store is updated correctly
    const editedItem = store.getState().mathItems[
      item.id
    ] as MathItem<MIT.ParametricSurface>;
    expect(editedItem.properties.expr).toBe(expression.expectedFinal);

    // assert MathScope updated correctly
    const f = mathScope.results.get(id("expr"));
    assertInstanceOf(f, Function);
    const actuals = evaluations.map((e) => f(...e.parmaValues));
    const expecteds = evaluations.map((e) => e.expectedOutput);
    expect(actuals).toHaveLength(2);
    expect(actuals).toStrictEqual(expecteds);
  }
);

test.each([
  {
    expression: {
      initial: "_f(x,y)=[x, y, 0]",
      // When typing "a+b" the last valid varname will be "a"
      expectedFinal: "_f(a,y)=[x, y, 0]",
    },
    expectedError: new UnmetDependencyError(["x"]),
    param: { name: "a+b", index: 0 },
  },
  {
    expression: {
      initial: "_f(x,y)=[x, y, 0]",
      expectedFinal: "_f(x,a)=[x, y, 0]",
    },
    expectedError: new UnmetDependencyError(["y"]),
    param: { name: "a+b", index: 1 },
  },
])(
  "invalid var names do not update the expression",
  async ({ expression, param, expectedError }) => {
    const item = makeItem(MIT.ParametricSurface, { expr: expression.initial });
    const id = nodeId(item);
    const helper = new IntegrationTest();
    helper.patchMathItems([item]);
    const { mathScope, store } = helper.render();

    const inputs = getParamNameInputs();
    await user.type(inputs[param.index], param.name);

    const itemAfterEdit = store.getState().mathItems[
      item.id
    ] as MathItem<MIT.ParametricSurface>;
    expect(itemAfterEdit.properties.expr).toBe(expression.expectedFinal);

    const fError = mathScope.evalErrors.get(id("expr"));
    expect(fError).toStrictEqual(expectedError);
  }
);

test.each([{ paramIndex: 0 }, { paramIndex: 1 }])(
  "when param name is invalid, error class is added, then removed when valid again",
  async ({ paramIndex }) => {
    const item = makeItem(MIT.ParametricSurface);
    const helper = new IntegrationTest();
    helper.patchMathItems([item]);
    helper.render();

    const paramInput = getParamNameInputs()[paramIndex];
    await user.type(paramInput, "a+b");
    expect(paramInput).toHaveClass("has-error");

    // selectRange approach https://github.com/testing-library/user-event/issues/232#issuecomment-640791105 was not working?
    await user.clear(paramInput);
    await user.type(paramInput, "ab");
    expect(paramInput).not.toHaveClass("has-error");
  }
);
