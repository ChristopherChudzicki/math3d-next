import {
  MathItemConfig,
  MathItemType,
  PropertyConfig,
  WidgetType,
} from "configs";
import { filter as collectionFilter } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import MathScope, { OnChangeListener } from "util/MathScope";
import { select } from "./mathItemsSlice";

// TEMPORARY... moving this to redux store
const useMathScope = (): MathScope => {
  return useAppSelector(select.mathScope());
};

type EvaluationResultsSlice<K extends string> = Partial<Record<K, unknown>>;
type EvaluationErrorsSlice<K extends string> = Partial<Record<K, Error>>;

const extractResults = <K extends string, PO>(
  scope: MathScope<PO>,
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

const extractErrors = <K extends string, PO>(
  scope: MathScope<PO>,
  ids: Record<K, string>
): EvaluationErrorsSlice<K> => {
  const newErrors: EvaluationErrorsSlice<K> = {};
  (Object.keys(ids) as K[]).forEach((name) => {
    const id = ids[name];
    if (scope.evalErrors.has(id)) {
      newErrors[name] = scope.evalErrors.get(id);
    }
    if (scope.parseErrors.has(id)) {
      newErrors[name] = scope.parseErrors.get(id);
    }
  });
  return newErrors;
};

export const mathScopeId = (itemId: string, propName: string) =>
  `${itemId}-${propName}`;

const useMathResults = <K extends string>(
  scope: MathScope,
  idPrefix: string,
  names: K[]
): EvaluationResultsSlice<K> => {
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
  scope: MathScope,
  idPrefix: string,
  names: readonly K[]
): EvaluationErrorsSlice<K> => {
  const [errorsSlice, setErrors] = useState<EvaluationErrorsSlice<K>>({});

  const ids = useMemo(() => {
    const entries = names.map((name) => [name, mathScopeId(idPrefix, name)]);
    return Object.fromEntries(entries) as Record<K, string>;
  }, [idPrefix, names]);

  const onChange = useCallback<OnChangeListener>(
    (event) => {
      const { mathScope } = event;
      const { evalErrors, parseErrors } = event.changes;
      if (
        names.some((name) => evalErrors.touched.has(ids[name])) ||
        names.some((name) => parseErrors.touched.has(ids[name]))
      ) {
        setErrors(extractErrors(mathScope, ids));
      }
    },
    [ids, names]
  );

  useEffect(() => {
    setErrors(extractErrors(scope, ids));
    scope.addEventListener("change", onChange);
    return () => {
      scope.removeEventListener("change", onChange);
    };
  }, [scope, ids, onChange]);

  return errorsSlice;
};

const MATH_WIDGETS = new Set([
  WidgetType.MathValue,
  WidgetType.MathAssignment,
  WidgetType.MathBoolean,
]);

const getMathProperties = <T extends MathItemType>(
  config: MathItemConfig<T>
): PropertyConfig<string>[] =>
  collectionFilter(config.properties, (p) => MATH_WIDGETS.has(p.widget));

export { getMathProperties, useMathScope, useMathErrors, useMathResults };
