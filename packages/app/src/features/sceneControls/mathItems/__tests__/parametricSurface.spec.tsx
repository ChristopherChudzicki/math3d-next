import {
  MathItem,
  MathItemType as MIT,
  mathItemConfigs,
} from "@math3d/mathitem-configs";
import {
  assertInstanceOf,
  makeItem,
  nodeId,
  renderTestApp,
  screen,
  seedDb,
  user,
  within,
} from "@/test_util";
import type { ParseableObjs, ParseableArray } from "@math3d/parser";
import { DetailedAssignmentError } from "@math3d/parser";
import invariant from "tiny-invariant";
import { setupItemTest } from "./__utils__";

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

const getParamNameInputs = (): [HTMLTextAreaElement, HTMLTextAreaElement] => {
  const zeroth = screen.getByLabelText("Name for 1st parameter");
  const first = screen.getByLabelText("Name for 2nd parameter");
  assertInstanceOf(zeroth, HTMLTextAreaElement);
  assertInstanceOf(first, HTMLTextAreaElement);
  return [zeroth, first];
};

const getDomainInputs = (
  itemElement: HTMLElement,
  dimension: 2 | 3
): HTMLTextAreaElement[] => {
  const zeroth = within(itemElement).getByLabelText("Domain for 1st parameter");
  const first = within(itemElement).getByLabelText("Domain for 2nd parameter");
  assertInstanceOf(zeroth, HTMLTextAreaElement);
  assertInstanceOf(first, HTMLTextAreaElement);
  const result = [zeroth, first];
  if (dimension === 3) {
    const second = within(itemElement).getByLabelText(
      "Domain for 3rd parameter"
    );
    assertInstanceOf(second, HTMLTextAreaElement);
    result.push(second);
  }
  return result;
};

type DomFunc = (x: number) => [number, number];

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

    const domExpectedEval = domain.expectedEvaluation;
    const domActualEval = mathScope.results.get(id("domain")) as {
      value: DomFunc[];
    };
    const val = Math.random();
    expect(domActualEval.value[0](val)).toEqual(domExpectedEval[0](val));
    expect(domActualEval.value[1](val)).toEqual(domExpectedEval[1](val));
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
    const { form } = await setupItemTest(MIT.ParametricSurface, {
      expr: {
        name: "_f",
        params: ["x", "y"],
        rhs: "[x, y, 0]",
        type: "function-assignment",
      },
    });

    const exprInput = within(form).getByLabelText(config.properties.expr.label);

    const paramInput = getParamNameInputs()[paramIndex];
    await user.clear(paramInput);
    paramInput.focus();
    await user.paste("a+b");

    // param is invalid
    expect(paramInput).toHaveClass("has-error");
    /**
     * And no other fields are marked invalid.
     *
     * Other properties are invalid:
     *  - expr is now a function with invalid LHS
     *  - domain is now a function with invalid LHS
     *
     * But we only want to display the error with the parameter.
     */
    expect(form.querySelectorAll("[aria-invalid=true]")).toHaveLength(1);
    expect(form.querySelectorAll(".has-error")).toHaveLength(1);

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

test.each([
  {
    domain: {
      initial: dom(
        //
        func("_f", ["y"], "[-5, 5]"),
        func("_f", ["x"], "[-x, x]")
      ),
      expectedFinal: dom(
        //
        func("_f", ["y"], "[-2, 2]"),
        func("_f", ["x"], "[-x, x]")
      ),
      expectedEvaluation: [
        //
        (_y: number) => [-2, 2],
        (x: number) => [-x, x],
      ],
    },
    change: { index: 0, value: "[-2, 2]" },
  },
  {
    domain: {
      initial: dom(
        //
        func("_f", ["y"], "[-5, 5]"),
        func("_f", ["x"], "[-x, x]")
      ),
      expectedFinal: dom(
        //
        func("_f", ["y"], "[-5, 5]"),
        func("_f", ["x"], "[-x^2, x^2]")
      ),
      expectedEvaluation: [
        (_y: number) => [-5, 5],
        (x: number) => [-(x ** 2), x ** 2],
      ],
    },
    change: { index: 1, value: "[-x^2, x^2]" },
  },
])(
  "Updating domain functions (ParametricSurface)",
  async ({ domain, change }) => {
    const { item, form, store } = await setupItemTest(MIT.ParametricSurface, {
      domain: domain.initial,
    });
    const domainInput = getDomainInputs(form, 2)[change.index];
    await user.clear(domainInput);
    await user.paste(change.value);

    const mathScope = store.getState().mathItems.mathScope();
    const id = nodeId(item);
    const domExpectedEval = domain.expectedEvaluation;
    const domActualEval = mathScope.results.get(id("domain")) as {
      value: DomFunc[];
    };
    const val = Math.random();
    expect(domActualEval.value[0](val)).toEqual(domExpectedEval[0](val));
    expect(domActualEval.value[1](val)).toEqual(domExpectedEval[1](val));
  }
);

test.each([0, 1, 2])("Updating domain arrays (ImplicitSurface)", async (i) => {
  /**
   * Here we want to test updating the domain values when the domain values are
   * an array. Implicit Surfaces use array values rather than functions.
   *
   * (Right now, surfaces support function-based domains.)
   */
  const { item, form, store } = await setupItemTest(MIT.ImplicitSurface, {
    domain: {
      type: "array",
      items: [
        { type: "expr", expr: "[-5,5]" },
        { type: "expr", expr: "[-5,5]" },
        { type: "expr", expr: "[-5,5]" },
      ],
    },
  });
  const domainInput = getDomainInputs(form, 3)[i];
  await user.clear(domainInput);
  await user.paste("[-2,2]");

  const mathScope = store.getState().mathItems.mathScope();
  const id = nodeId(item);
  const domExpectedEval = [
    [-5, 5],
    [-5, 5],
    [-5, 5],
  ].map((arr, j) => (i === j ? [-2, 2] : arr));
  const domActualEval = mathScope.results.get(id("domain"));
  expect(domActualEval).toEqual(domExpectedEval);
});

test.each([
  {
    domainInitial: dom(
      //
      func("_f", ["y"], "[-5, 5] + "),
      func("_f", ["x"], "[-x, x]")
    ),
    errIndices: [0],
    errClass: AggregateError,
    errMatcher: expect.objectContaining({
      errors: expect.objectContaining({
        0: expect.objectContaining({
          rhs: expect.objectContaining({
            message: expect.stringMatching(/Unexpected end of expression/),
          }),
        }),
      }),
    }),
  },
])(
  "Domain functions errors",
  async ({ domainInitial, errClass, errIndices, errMatcher }) => {
    const { form, store, item } = await setupItemTest(MIT.ParametricSurface, {
      domain: domainInitial,
    });

    const errCount = errIndices.length;
    expect(form.querySelectorAll("[aria-invalid=true]")).toHaveLength(errCount);
    expect(form.querySelectorAll(".has-error")).toHaveLength(errCount);
    const domainInputs = getDomainInputs(form, 2);
    errIndices.forEach((i) => {
      expect(domainInputs[i]).toHaveClass("has-error");
      expect(domainInputs[i]).toHaveAttribute("aria-invalid", "true");
    });

    const mathScope = store.getState().mathItems.mathScope();
    const id = nodeId(item);

    const error = mathScope.errors.get(id("domain"));
    expect(error).toBeInstanceOf(errClass);
    expect(error).toEqual(errMatcher);
  }
);

test.each([
  {
    domainInitial: dom(
      //
      func("_f", ["y"], "[-5, 5] + "),
      func("_f", ["x"], "[-x, x]")
    ),
    errIndices: [0],
    errClass: AggregateError,
    errMatcher: expect.objectContaining({
      errors: expect.objectContaining({
        0: expect.objectContaining({
          rhs: expect.objectContaining({
            message: expect.stringMatching(/Unexpected end of expression/),
          }),
        }),
      }),
    }),
  },
  {
    domainInitial: dom(
      //
      func("_f", ["y"], "[0, a + b]"),
      func("_f", ["x"], "[0, x]")
    ),
    errIndices: [0],
    errClass: AggregateError,
    errMatcher: expect.objectContaining({
      errors: expect.objectContaining({
        0: expect.objectContaining({
          message: expect.stringMatching(/Undefined symbol a/),
        }),
      }),
    }),
  },
  {
    domainInitial: dom(
      //
      func("_f", ["y"], "[0, y]"),
      func("_f", ["x"], "[0, x]")
    ),
    errIndices: [0, 1],
    errClass: Error,
    errMatcher: expect.objectContaining({
      message: "Cyclic Dependency: Both domain functions depend on each other.",
    }),
  },
])(
  "Domain functions errors",
  async ({ domainInitial, errClass, errIndices, errMatcher }) => {
    const { form, store, item } = await setupItemTest(MIT.ParametricSurface, {
      domain: domainInitial,
    });

    const errCount = errIndices.length;
    expect(form.querySelectorAll("[aria-invalid=true]")).toHaveLength(errCount);
    expect(form.querySelectorAll(".has-error")).toHaveLength(errCount);
    const domainInputs = getDomainInputs(form, 2);
    errIndices.forEach((i) => {
      expect(domainInputs[i]).toHaveClass("has-error");
      expect(domainInputs[i]).toHaveAttribute("aria-invalid", "true");
    });

    const mathScope = store.getState().mathItems.mathScope();
    const id = nodeId(item);

    const error = mathScope.errors.get(id("domain"));
    expect(error).toBeInstanceOf(errClass);
    expect(error).toEqual(errMatcher);
  }
);
