import {
  MathItem,
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "@math3d/mathitem-configs";
import React, { useMemo } from "react";

import * as u from "@/util/styles/utils.module.css";
import FieldWidget from "../FieldWidget";
import { useMathScope } from "../mathItemsSlice";
import { useMathErrors } from "../mathScope";
import ItemTemplate from "../templates/ItemTemplate";
import { DomainForm, useExpressionsAndParameters } from "./expressionHelpers";
import type { ExpressionProps } from "./expressionHelpers";

interface GenericRangedMathItemFormProps<T extends MIT> {
  item: MathItem<T>;
  exprNames: readonly (keyof MathItem<T>["properties"] & string)[];
  children?: React.FC<ExpressionProps>;
  domainFunctions?: boolean;
}

type RangedMathItemFormProps =
  | GenericRangedMathItemFormProps<MIT.ParametricCurve>
  | GenericRangedMathItemFormProps<MIT.ParametricSurface>
  | GenericRangedMathItemFormProps<MIT.ExplicitSurface>
  | GenericRangedMathItemFormProps<MIT.ExplicitSurfacePolar>
  | GenericRangedMathItemFormProps<MIT.VectorField>
  | GenericRangedMathItemFormProps<MIT.ImplicitSurface>;

const RangedMathItemForm = ({
  item,
  exprNames,
  children,
}: RangedMathItemFormProps) => {
  const config = configs[item.type];
  const { domain } = item.properties;
  const numParams = domain.items.length;
  const mathScope = useMathScope();
  const errorNames = useMemo(() => [...exprNames, "domain"], [exprNames]);
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const exprProps = useExpressionsAndParameters(
    item,
    exprNames,
    numParams,
    errors
  );
  const { assignments, handlers, errors: assignmentErrors } = exprProps;

  return (
    <ItemTemplate item={item} config={config}>
      {children ? (
        children({ assignments, handlers, errors: assignmentErrors })
      ) : (
        <FieldWidget
          widget={WidgetType.MathValue}
          className={u.dBlock}
          // @ts-expect-error exprName should be correlated with properties
          label={config.properties[exprNames[0]].label}
          name={exprNames[0]}
          error={assignmentErrors[0].rhs}
          value={assignments[0].rhs}
          onChange={handlers.rhs[0]}
        />
      )}
      <DomainForm
        item={item}
        exprProps={exprProps}
        domainError={errors.domain}
      />
    </ItemTemplate>
  );
};

export default RangedMathItemForm;
