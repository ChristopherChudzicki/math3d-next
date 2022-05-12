/* eslint-disable testing-library/no-node-access */
import React, {
  useImperativeHandle,
  forwardRef,
  MutableRefObject,
  useEffect,
} from "react";
import { render } from "@testing-library/react";
import MathScope, { UnmetDependencyError } from "util/MathScope";
import { assertNotNil } from "util/predicates";
import { act } from "react-dom/test-utils";
import { CyclicAssignmentError } from "util/MathScope/Evaluator";
import {
  MathContext,
  useMathErrors,
  useMathResults,
  useModifyMathEpressions,
} from "./mathScope";

type Errors = Record<string, Error>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Results = Record<string, any>;

interface TestResultsProps {
  names: string[];
  prefix: string;
  onRender: (results: Results) => void;
}
const TestResultsWithRef: React.ForwardRefRenderFunction<
  ReturnType<typeof useModifyMathEpressions>,
  TestResultsProps
> = ({ names, prefix, onRender }, ref) => {
  const results = useMathResults(prefix, names);
  const { setExpressions, deleteExpressions } = useModifyMathEpressions(prefix);
  useImperativeHandle(ref, () => ({ setExpressions, deleteExpressions }));
  useEffect(() => {
    onRender(results as Results);
  });
  return null;
};
const TestResults = forwardRef(TestResultsWithRef);

interface TestErrorsProps {
  names: string[];
  prefix: string;
  onRender: (results: Errors) => void;
}
const TestErrorsWithRef: React.ForwardRefRenderFunction<
  ReturnType<typeof useModifyMathEpressions>,
  TestErrorsProps
> = ({ names, prefix, onRender }, ref) => {
  const errors = useMathErrors(prefix, names);
  const { setExpressions, deleteExpressions } = useModifyMathEpressions(prefix);
  useImperativeHandle(ref, () => ({ setExpressions, deleteExpressions }));
  useEffect(() => {
    onRender(errors as Errors);
  });
  return null;
};
const TestErrors = forwardRef(TestErrorsWithRef);

describe("useMathValues and useModifyMathEpressions", () => {
  const setup = (prefix: string, names: string[]) => {
    // This is a false positive from eslint; eslint seems to think this is a component
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const mathScope = new MathScope();
    const ref: MutableRefObject<ReturnType<
      typeof useModifyMathEpressions
    > | null> = {
      current: null,
    };
    const resultsSlice: { current: Results | null } = { current: null };
    const errorsSlice: { current: Errors | null } = { current: null };
    const rerenders: { results: number; errors: number } = {
      results: 0,
      errors: 0,
    };
    render(
      <MathContext.Provider value={mathScope}>
        <TestResults
          prefix={prefix}
          names={names}
          ref={ref}
          onRender={(slice) => {
            rerenders.results += 1;
            resultsSlice.current = slice;
          }}
        />
        <TestErrors
          prefix={prefix}
          names={names}
          ref={ref}
          onRender={(slice) => {
            rerenders.errors += 1;
            errorsSlice.current = slice;
          }}
        />
      </MathContext.Provider>
    );
    assertNotNil(ref.current);
    assertNotNil(resultsSlice.current);
    assertNotNil(errorsSlice.current);
    const { setExpressions, deleteExpressions } = ref.current;

    rerenders.errors = 0;
    rerenders.results = 0;

    return {
      rerenders,
      results: resultsSlice as { current: Results },
      errors: errorsSlice as { current: Errors },
      setExpressions,
      deleteExpressions,
    };
  };

  test("useMathValues triggers re-renders when values change", async () => {
    const { results, setExpressions } = setup("id1", ["a", "b", "c"]);

    await act(() => {
      setExpressions([{ name: "a", expr: "a = 1 + 2" }]);
    });

    expect(results.current).toStrictEqual({ a: 3 });

    await act(() => {
      setExpressions([{ name: "b", expr: "a^2" }]);
    });

    expect(results.current).toStrictEqual({ a: 3, b: 9 });
  });

  test("useMathErrors triggers re-renders when errors change", async () => {
    const { errors, setExpressions } = setup("id1", ["x", "y", "z"]);

    await act(() => {
      setExpressions([{ name: "x", expr: "x = y^2" }]);
    });

    expect(errors.current).toStrictEqual({
      x: expect.any(UnmetDependencyError),
    });

    await act(() => {
      setExpressions([{ name: "y", expr: "y = x^2" }]);
    });

    expect(errors.current).toStrictEqual({
      x: expect.any(CyclicAssignmentError),
      y: expect.any(CyclicAssignmentError),
    });
  });
});
