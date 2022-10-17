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
import MathScope from "@/util/MathScope";
import type { IdentifiedParseable } from "@/util/MathScope";
import type { Parseable } from "@/util/parsing";

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
): IdentifiedParseable<Parseable>[] =>
  items.flatMap((item) => {
    const config = mathItemConfigs[item.type];
    const mathProperties = getMathProperties(config);
    return (
      mathProperties
        // @ts-expect-error ... TS does not know config and item are correlated
        .filter((prop) => isNotNil(item.properties[prop.name]))
        .map((prop) => {
          // @ts-expect-error ... TS does not know config and item are correlated
          const parseable: Parseable = item.properties[prop.name];
          const parseableObj =
            typeof parseable === "string" ? { expr: parseable } : parseable;
          return {
            id: mathScopeId(item.id, prop.name),
            parseable: {
              ...parseableObj,
              validate: prop.validate,
            },
          };
        })
    );
  });

const syncItemsToMathScope = (
  mathScope: MathScope<Parseable>,
  items: MathItemPatch[]
) => {
  const identifiedExpressions = getIdentifiedExpressions(items);
  mathScope.setExpressions(identifiedExpressions);
};

const removeItemsFromMathScope = (
  mathScope: MathScope<Parseable>,
  items: MathItem[]
) => {
  const identifiedExpressions = getIdentifiedExpressions(items);
  mathScope.deleteExpressions(identifiedExpressions.map(({ id }) => id));
};

export { syncItemsToMathScope, removeItemsFromMathScope };
