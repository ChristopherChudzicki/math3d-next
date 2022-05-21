import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { MathItem, MathItemConfig, WidgetType, MathItemType } from "configs";
import MathScope, {
  OnChangeListener,
  IdentifiedExpression,
} from "util/MathScope";

const defaultMathScope = new MathScope();
// @ts-expect-error assign to window for debugging
window.mathScope = defaultMathScope;
const MathContext = createContext(defaultMathScope);

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
  names: readonly K[]
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
  WidgetType.MathEquality,
  WidgetType.MathBoolean,
]);

const getMathProperties = <T extends MathItemType>(
  config: MathItemConfig<T>
): MathItemConfig<T>["properties"] =>
  // @ts-expect-error https://github.com/microsoft/TypeScript/issues/44373
  config.properties.filter((prop) => MATH_WIDGETS.has(prop.widget));

/**
 * Populate the mathscope with initial values based on item properties. Removes
 * expressions from scope on cleanup.
 */
const usePopulateMathScope = <T extends MathItemType>(
  item: MathItem<T>,
  config: MathItemConfig<T>
) => {
  const mathScope = useContext(MathContext);
  useEffect(() => {
    const mathProperties = getMathProperties(config);
    const identifiedExpressions: IdentifiedExpression[] = mathProperties.map(
      (prop) => {
        return {
          id: mathScopeId(item.id, prop.name),
          // @ts-expect-error ... why doesn't TS realize these are correlated?
          expr: item.properties[prop.name],
          parseOptions: { validate: prop.validate },
        };
      }
    );
    mathScope.setExpressions(identifiedExpressions);
    return () => {
      mathScope.deleteExpressions(identifiedExpressions.map(({ id }) => id));
    };
  }, [item, mathScope, config]);
};

export {
  MathContext,
  useMathResults,
  useMathErrors,
  usePopulateMathScope,
  getMathProperties,
};
