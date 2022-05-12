import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import MathScope, { OnChangeListener } from "util/MathScope";

const MathContext = createContext(new MathScope());

type EvaluationResultsSlice<K extends string> = Partial<Record<K, unknown>>;
type EvaluationErrorsSlice<K extends string> = Partial<Record<K, Error>>;

const extractResults = <K extends string>(
  scope: MathScope,
  ids: Record<K, string>
): EvaluationResultsSlice<K> => {
  const newResult: EvaluationResultsSlice<K> = {};
  (Object.keys(ids) as K[]).forEach((name) => {
    const id = ids[name];
    if (scope.results.has(id)) {
      newResult[name] = scope.results.get(id);
    }
  });
  return newResult;
};

const extrractErrors = <K extends string>(
  scope: MathScope,
  ids: Record<K, string>
): EvaluationErrorsSlice<K> => {
  const newErrors: EvaluationErrorsSlice<K> = {};
  (Object.keys(ids) as K[]).forEach((name) => {
    const id = ids[name];
    if (scope.errors.has(id)) {
      newErrors[name] = scope.errors.get(id);
    }
  });
  return newErrors;
};

const mathScopeId = (itemId: string, propName: string) =>
  `${itemId}-${propName}`;

const useMathResults = <K extends string>(
  idPrefix: string,
  names: K[]
): EvaluationResultsSlice<K> => {
  const scope = useContext(MathContext);

  const [resultsSlice, setResults] = useState<EvaluationResultsSlice<K>>({});

  const ids = useMemo(() => {
    const entries = names.map((name) => [name, mathScopeId(idPrefix, name)]);
    return Object.fromEntries(entries) as Record<K, string>;
  }, [idPrefix, names]);

  const onChange = useCallback<OnChangeListener>(
    (event) => {
      const { mathScope } = event;
      const { results } = event.changes;
      if (names.some((name) => results.touched.has(ids[name]))) {
        setResults(extractResults(mathScope, ids));
      }
    },
    [ids, names]
  );

  useEffect(() => {
    setResults(extractResults(scope, ids));
    scope.addEventListener("change", onChange);
    return () => {
      scope.removeEventListener("change", onChange);
    };
  }, [scope, ids, onChange]);

  return resultsSlice;
};

const useMathErrors = <K extends string>(
  idPrefix: string,
  names: K[]
): EvaluationErrorsSlice<K> => {
  const scope = useContext(MathContext);

  const [errorsSlice, setErrors] = useState<EvaluationErrorsSlice<K>>({});

  const ids = useMemo(() => {
    const entries = names.map((name) => [name, mathScopeId(idPrefix, name)]);
    return Object.fromEntries(entries) as Record<K, string>;
  }, [idPrefix, names]);

  const onChange = useCallback<OnChangeListener>(
    (event) => {
      const { mathScope } = event;
      const { errors } = event.changes;
      if (names.some((name) => errors.touched.has(ids[name]))) {
        setErrors(extrractErrors(mathScope, ids));
      }
    },
    [ids, names]
  );

  useEffect(() => {
    setErrors(extrractErrors(scope, ids));
    scope.addEventListener("change", onChange);
    return () => {
      scope.removeEventListener("change", onChange);
    };
  }, [scope, ids, onChange]);

  return errorsSlice;
};

interface NamedExpression {
  name: string;
  expr: string;
}

const useModifyMathEpressions = (
  idPrefix: string
): {
  setExpressions: (
    namedExpressions: NamedExpression[]
  ) => ReturnType<MathScope["setExpressions"]>;
  deleteExpressions: (
    names: string[]
  ) => ReturnType<MathScope["deleteExpressions"]>;
} => {
  const scope = useContext(MathContext);
  const setExpressions = useCallback(
    (namedExpressions: NamedExpression[]) => {
      const identifiedExpressions = namedExpressions.map((named) => ({
        id: mathScopeId(idPrefix, named.name),
        expr: named.expr,
      }));
      const result = scope.setExpressions(identifiedExpressions);
      return result;
    },
    [idPrefix, scope]
  );

  const deleteExpressions = useCallback(
    (names: string[]) => {
      const ids = names.map((name) => mathScopeId(idPrefix, name));
      return scope.deleteExpressions(ids);
    },
    [idPrefix, scope]
  );
  return { setExpressions, deleteExpressions };
};

export { MathContext, useMathResults, useMathErrors, useModifyMathEpressions };
