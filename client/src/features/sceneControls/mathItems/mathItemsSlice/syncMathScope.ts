import {
  WidgetType,
  MathItemType,
  MathItemConfig,
  PropertyConfig,
  MathItem,
  mathItemConfigs,
  MathItemPatch,
} from "@/configs";
import { filter as collectionFilter } from "lodash";
import { isNotNil } from "@/util/predicates";
import MathScope, { IdentifiedExpression } from "@/util/MathScope";

const mathScopeId = (itemId: string, propName: string) =>
  `${itemId}-${propName}`;

const MATH_WIDGETS = new Set([
  WidgetType.MathValue,
  WidgetType.MathAssignment,
  WidgetType.MathBoolean,
  WidgetType.CustomMath,
]);

const getMathProperties = <T extends MathItemType>(
  config: MathItemConfig<T>
): PropertyConfig<string>[] =>
  collectionFilter(config.properties, (p) => MATH_WIDGETS.has(p.widget));

const getIdentifiedExpressions = (
  items: MathItemPatch[]
): IdentifiedExpression[] =>
  items.flatMap((item) => {
    const config = mathItemConfigs[item.type];
    const mathProperties = getMathProperties(config);
    return (
      mathProperties
        // @ts-expect-error ... TS does not know config and item are correlated
        .filter((prop) => isNotNil(item.properties[prop.name]))
        .map((prop) => {
          return {
            id: mathScopeId(item.id, prop.name),
            // @ts-expect-error ... TS does not know config and item are correlated
            expr: item.properties[prop.name],
            parseOptions: { validate: prop.validate },
          };
        })
    );
  });

const syncItemsToMathScope = (mathScope: MathScope, items: MathItemPatch[]) => {
  const identifiedExpressions = getIdentifiedExpressions(items);
  mathScope.setExpressions(identifiedExpressions);
};

const removeItemsFromMathScope = (mathScope: MathScope, items: MathItem[]) => {
  const identifiedExpressions = getIdentifiedExpressions(items);
  mathScope.deleteExpressions(identifiedExpressions.map(({ id }) => id));
};

export { syncItemsToMathScope, removeItemsFromMathScope };
