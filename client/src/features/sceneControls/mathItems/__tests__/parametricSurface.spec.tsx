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
import type { ParseableObjs, ParseableArray } from "@/util/parsing";
import { DetailedAssignmentError } from "@/util/parsing/MathJsParser";
import invariant from "tiny-invariant";

const func = (
  name: string,
  params: string[],
  rhs: string
): ParseableObjs["function-assignment"] => ({
  type: "function-assignment",
  name,
  params,
  rhs,
});

const dom = (
  ...funcs: ParseableObjs["function-assignment"][]
): ParseableArray<ParseableObjs["function-assignment"]> => ({
  type: "array",
  items: funcs,
});

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
      initial: func("_f", ["x", "y"], "[1+abc, 0, 0]"),
      expectedFinal: func("_f", ["abc", "y"], "[1+abc, 0, 0]"),
      expectedEvaluation: (abc: number, _y: number) => [1 + abc, 0, 0],
    },
    domain: {
      initial: dom(
        func("_f", ["y"], "[-5, 5]"),
        func("_f", ["x"], "[-abc, abc]")
      ),
      expectedFinal: dom(
        func("_f", ["y"], "[-5, 5]"),
        func("_f", ["abc"], "[-abc, abc]")
      ),
      expectedEvaluation: [
        (_x: number) => [-5, 5],
        (abc: number) => [-abc, abc],
      ],
    },
    param: { name: "abc", index: 0 },
  },
  {
    expression: {
      initial: func("_f", ["x", "y"], "[1+abc, 0, 0]"),
      expectedFinal: func("_f", ["x", "abc"], "[1+abc, 0, 0]"),
      expectedEvaluation: (_x: number, abc: number) => [1 + abc, 0, 0],
    },
    domain: {
      initial: dom(
        func("_f", ["y"], "[-abc, abc]"),
        func("_f", ["x"], "[-5, 5]")
      ),
      expectedFinal: dom(
        func("_f", ["abc"], "[-abc, abc]"),
        func("_f", ["x"], "[-5, 5]")
      ),
      expectedEvaluation: [(abc: number) => [-abc, abc], () => [-5, 5]],
    },
    param: { name: "abc", index: 1 },
  },
])(
  "Updating parameter names updates other fields appropriately",
  async ({ expression, param, domain }) => {
    const item = makeItem(MIT.ParametricSurface, {
      expr: expression.initial,
      domain: domain.initial,
    });
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
    expect(editedItem.properties.domain).toEqual(domain.expectedFinal);

    // assert MathScope updated correctly
    const exprF = mathScope.results.get(id("expr"));
    invariant(exprF instanceof Function);

    const [x, y] = [Math.random(), Math.random()];
    expect(exprF(x, y)).toEqual(expression.expectedEvaluation(x, y));

    type DomFunc = (x: number) => [number, number];
    const domExpectedEval = domain.expectedEvaluation;
    const domActualEval = mathScope.results.get(id("domain")) as DomFunc[];
    const val = Math.random();
    expect(domActualEval[0](val)).toEqual(domExpectedEval[0](val));
    expect(domActualEval[1](val)).toEqual(domExpectedEval[1](val));
  }
);

test.each([
  {
    expression: {
      initial: func("_f", ["x", "y"], "[1+abc, 0, 0]"),
      expectedFinal: func("_f", ["a+b", "y"], "[1+abc, 0, 0]"),
    },
    param: { name: "a+b", index: 0 },
  },
  {
    expression: {
      initial: func("_f", ["x", "y"], "[1+abc, 0, 0]"),
      expectedFinal: func("_f", ["x", "a+b"], "[1+abc, 0, 0]"),
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
        name: "_f",
        params: ["x", "y"],
        rhs: "[x, y, 0]",
        type: "function-assignment",
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
