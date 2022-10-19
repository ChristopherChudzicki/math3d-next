import { MathItem, MathItemType as MIT, mathItemConfigs } from "@/configs";
import {
  assertInstanceOf,
  makeItem,
  nodeId,
  renderTestApp,
  screen,
  seedDb,
  user,
} from "@/test_util";
import { DetailedAssignmentError } from "@/util/parsing/MathJsParser";

const config = mathItemConfigs[MIT.ParametricSurface];

const getParamNameInputs = (): HTMLTextAreaElement[] => {
  const zeroth = screen.getByLabelText("Name for 1st parameter");
  const first = screen.getByLabelText("Name for 2nd parameter");
  assertInstanceOf(zeroth, HTMLTextAreaElement);
  assertInstanceOf(first, HTMLTextAreaElement);
  return [zeroth, first];
};

test.each([
  {
    expression: {
      initial: {
        lhs: "_f(x,y)",
        rhs: "[1+abc, 0, 0]",
        type: "assignment" as const,
      },
      expectedFinal: {
        lhs: "_f(abc,y)",
        rhs: "[1+abc, 0, 0]",
        type: "assignment" as const,
      },
    },
    evaluations: [
      { parmaValues: [1, 0], expectedOutput: [2, 0, 0] },
      { parmaValues: [0, 1], expectedOutput: [1, 0, 0] },
    ],
    param: { name: "abc", index: 0 },
  },
  {
    expression: {
      initial: {
        lhs: "_f(x,y)",
        rhs: "[1+abc, 0, 0]",
        type: "assignment" as const,
      },
      expectedFinal: {
        lhs: "_f(x,abc)",
        rhs: "[1+abc, 0, 0]",
        type: "assignment" as const,
      },
    },
    evaluations: [
      { parmaValues: [1, 0], expectedOutput: [1, 0, 0] },
      { parmaValues: [0, 1], expectedOutput: [2, 0, 0] },
    ],
    param: { name: "abc", index: 1 },
  },
])(
  "Updating parameter names updates expression appropriately",
  async ({ expression, param, evaluations }) => {
    const item = makeItem(MIT.ParametricSurface, { expr: expression.initial });
    const id = nodeId(item);
    const scene = seedDb.withSceneFromItems([item]);
    const { store } = await renderTestApp(`/${scene.id}`);

    const mathScope = store.getState().mathItems.mathScope();
    await new Promise((resolve) => {
      setTimeout(resolve);
    });
    // initiall there is an error since the expr RHS contains "abc" which is not a param name or defined variable
    expect(mathScope.errors.has(id("expr"))).toBe(true);
    const inputs = getParamNameInputs();
    await user.clear(inputs[param.index]);
    await user.click(inputs[param.index]);
    await user.paste(param.name);

    // assert store is updated correctly
    const editedItem = store.getState().mathItems.items[
      item.id
    ] as MathItem<MIT.ParametricSurface>;
    expect(editedItem.properties.expr).toEqual(expression.expectedFinal);

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
      initial: {
        lhs: "_f(x,y)",
        rhs: "[x, y, 0]",
        type: "assignment" as const,
      },
      expectedFinal: {
        lhs: "_f(a+b,y)",
        rhs: "[x, y, 0]",
        type: "assignment" as const,
      },
    },
    param: { name: "a+b", index: 0 },
  },
  {
    expression: {
      initial: {
        lhs: "_f(x,y)",
        rhs: "[x, y, 0]",
        type: "assignment" as const,
      },
      expectedFinal: {
        lhs: "_f(x,a+b)",
        rhs: "[x, y, 0]",
        type: "assignment" as const,
      },
    },
    param: { name: "a+b", index: 1 },
  },
])(
  "invalid var names also update the expression",
  async ({ expression, param }) => {
    const item = makeItem(MIT.ParametricSurface, { expr: expression.initial });
    const id = nodeId(item);
    const scene = seedDb.withSceneFromItems([item]);
    const { store } = await renderTestApp(`/${scene.id}`);

    const mathScope = store.getState().mathItems.mathScope();
    const inputs = getParamNameInputs();

    await user.clear(inputs[param.index]);
    await user.click(inputs[param.index]);
    await user.paste(param.name);

    const itemAfterEdit = store.getState().mathItems.items[
      item.id
    ] as MathItem<MIT.ParametricSurface>;
    expect(itemAfterEdit.properties.expr).toEqual(expression.expectedFinal);

    const fError = mathScope.errors.get(id("expr"));
    assertInstanceOf(fError, DetailedAssignmentError);
    expect(fError.lhs).toBeInstanceOf(Error);
  }
);

test.each([{ paramIndex: 0 }, { paramIndex: 1 }])(
  "when param name is invalid, error class is added, then removed when valid again",
  async ({ paramIndex }) => {
    const item = makeItem(MIT.ParametricSurface, {
      expr: {
        lhs: "_f(x,y)",
        rhs: "[x, y, 0]",
        type: "assignment",
      },
    });
    const scene = seedDb.withSceneFromItems([item]);
    await renderTestApp(`/${scene.id}`);

    const exprInput = screen.getByLabelText(config.properties.expr.label);

    const paramInput = getParamNameInputs()[paramIndex];
    await user.clear(paramInput);
    paramInput.focus();
    await user.paste("a+b");

    // param is invalid
    expect(paramInput).toHaveClass("has-error");
    // expression is not (debateable, since one var is undefined now)
    expect(exprInput).not.toHaveClass("has-error");

    await user.clear(paramInput);
    paramInput.focus();
    await user.paste("ab");
    // param is valid
    expect(paramInput).not.toHaveClass("has-error");
    // expr is not.. one var is definitely undefined
    expect(exprInput).toHaveClass("has-error");

    await user.clear(exprInput);
    exprInput.focus();
    await user.paste("[1,1,1]");
    expect(exprInput).not.toHaveClass("has-error");
  }
);
