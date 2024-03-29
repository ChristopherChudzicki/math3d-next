import {
  WidgetType,
  MathItemType,
  MathItemConfig,
  PropertyConfig,
  MathItem,
  mathItemConfigs,
  MathItemPatch,
} from "@math3d/mathitem-configs";
import { filter as collectionFilter } from "lodash-es";
import { isNotNil } from "@/util/predicates";
import type { IdentifiedParseable } from "@math3d/mathscope";
import type { Parseable } from "@math3d/parser";
import { AppMathScope } from "./interfaces";

const mathScopeId = (itemId: string, propName: string) =>
  `${itemId}-${propName}`;

const MATH_WIDGETS = new Set([
  WidgetType.MathValue,
  WidgetType.MathAssignment,
  WidgetType.MathBoolean,
  WidgetType.CustomMath,
]);

const getMathProperties = <T extends MathItemType>(
  config: MathItemConfig<T>,
): PropertyConfig<string, unknown>[] =>
  collectionFilter(config.properties, (p) => MATH_WIDGETS.has(p.widget));

const getIdentifiedExpressions = (
  items: MathItemPatch[],
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
          const parseableObj: Parseable =
            typeof parseable === "string"
              ? { expr: parseable, type: "expr" }
              : parseable;
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
  mathScope: AppMathScope,
  items: MathItemPatch[],
) => {
  const identifiedExpressions = getIdentifiedExpressions(items);
  mathScope.setExpressions(identifiedExpressions);
};

const removeItemsFromMathScope = (
  mathScope: AppMathScope,
  items: MathItem[],
) => {
  const identifiedExpressions = getIdentifiedExpressions(items);
  mathScope.deleteExpressions(identifiedExpressions.map(({ id }) => id));
};

export { syncItemsToMathScope, removeItemsFromMathScope };
