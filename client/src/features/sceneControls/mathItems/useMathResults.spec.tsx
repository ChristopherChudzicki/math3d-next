import { render } from "@testing-library/react";
import React, { useEffect } from "react";
import { act } from "react-dom/test-utils";
import MathScope, { UnmetDependencyError } from "util/MathScope";
import { CyclicAssignmentError } from "util/MathScope/Evaluator";
import { assertNotNil } from "util/predicates";

import { MathContext, useMathErrors, useMathResults } from "./mathScope";

type Errors = Record<string, Error>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Results = Record<string, any>;

interface TestResultsProps {
  names: string[];
  prefix: string;
  onRender: (results: Results) => void;
}
const TestResults: React.FC<TestResultsProps> = ({
  names,
  prefix,
  onRender,
}) => {
  const results = useMathResults(prefix, names);
  useEffect(() => {
    onRender(results as Results);
  });
  return null;
};
interface TestErrorsProps {
  names: string[];
  prefix: string;
  onRender: (results: Errors) => void;
}
const TestErrors: React.FC<TestErrorsProps> = ({ names, prefix, onRender }) => {
  const errors = useMathErrors(prefix, names);
  useEffect(() => {
    onRender(errors as Errors);
  });
  return null;
};

describe("useMathResults and useMathErrors", () => {
  const setup = (prefix: string, names: string[]) => {
    // This is a false positive from eslint; eslint seems to think this is a component
    // eslint-disable-next-line react/jsx-no-constructed-context-values
    const mathScope = new MathScope();
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
          onRender={(slice) => {
            rerenders.results += 1;
            resultsSlice.current = slice;
          }}
        />
        <TestErrors
          prefix={prefix}
          names={names}
          onRender={(slice) => {
            rerenders.errors += 1;
            errorsSlice.current = slice;
          }}
        />
      </MathContext.Provider>
    );
    assertNotNil(resultsSlice.current);
    assertNotNil(errorsSlice.current);

    rerenders.errors = 0;
    rerenders.results = 0;

    return {
      rerenders,
      results: resultsSlice as { current: Results },
      errors: errorsSlice as { current: Errors },
      mathScope,
    };
  };

  test("useMathResults triggers re-renders when values change", async () => {
    const { results, mathScope } = setup("id1", ["a", "b", "c"]);

    await act(() => {
      mathScope.setExpressions([{ id: "id1-a", expr: "a = 1 + 2" }]);
    });

    expect(results.current).toStrictEqual({ a: 3 });

    await act(() => {
      mathScope.setExpressions([{ id: "id1-b", expr: "a^2" }]);
    });

    expect(results.current).toStrictEqual({ a: 3, b: 9 });
  });

  test("useMathErrors triggers re-renders when eval errors change", async () => {
    const { errors, mathScope } = setup("id1", ["x", "y", "z"]);

    await act(() => {
      mathScope.setExpressions([{ id: "id1-x", expr: "x = y^2" }]);
    });

    expect(errors.current).toStrictEqual({
      x: expect.any(UnmetDependencyError),
    });

    await act(() => {
      mathScope.setExpressions([{ id: "id1-y", expr: "y = x^2" }]);
    });

    expect(errors.current).toStrictEqual({
      x: expect.any(CyclicAssignmentError),
      y: expect.any(CyclicAssignmentError),
    });
  });

  test("useMathErrors triggers re-renders when parse errors change", async () => {
    const { errors, mathScope } = setup("id1", ["x"]);

    await act(() => {
      mathScope.setExpressions([{ id: "id1-x", expr: "x = 3^" }]);
    });

    expect(errors.current).toStrictEqual({
      x: expect.any(Error),
    });

    await act(() => {
      mathScope.setExpressions([{ id: "id1-x", expr: "x = 3^2" }]);
    });

    expect(errors.current).toStrictEqual({});
  });
});
