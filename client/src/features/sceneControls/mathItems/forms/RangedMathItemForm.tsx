import {
  MathItem,
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "configs";
import ordinal from "ordinal";
import React from "react";

import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { useMathScope } from "../mathItemsSlice";
import { useMathErrors } from "../mathScope";
import ItemTemplate from "../templates/ItemTemplate";
import styles from "./ItemForms.module.css";
import {
  ParameterContainer,
  ParameterForm,
  useExpressionsAndParameters,
} from "./expressionHelpers";
import type { ExpressionProps } from "./expressionHelpers";

interface GenericRangedMathItemFormProps<T extends MIT> {
  item: MathItem<T>;
  exprNames: readonly (keyof MathItem<T>["properties"] & string)[];
  errorNames: readonly (keyof MathItem<T>["properties"] & string)[];
  rangePropNames: readonly (keyof MathItem<T>["properties"] & string)[];
  children?: React.FC<ExpressionProps>;
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
  rangePropNames,
  errorNames,
  children,
}: RangedMathItemFormProps) => {
  const config = configs[item.type];
  const onWidgetChange = useOnWidgetChange(item);
  const numParams = rangePropNames.length;
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const {
    assignments,
    handlers,
    errors: exprErrors,
  } = useExpressionsAndParameters(
    item,
    exprNames,
    numParams,
    onWidgetChange,
    errors
  );

  return (
    <ItemTemplate item={item} config={config}>
      {children ? (
        children({ assignments, handlers, errors: exprErrors })
      ) : (
        <FieldWidget
          widget={WidgetType.MathValue}
          // @ts-expect-error exprName should be correlated with properties
          label={config.properties[exprNames[0]].label}
          name={exprNames[0]}
          error={exprErrors[0].rhs ?? exprErrors[0].lhs}
          value={assignments[0].rhs}
          onChange={handlers.rhs[0]}
        />
      )}
      <ParameterContainer>
        {rangePropNames.map((rangeProp, i) => (
          <ParameterForm
            key={rangeProp}
            nameInput={
              <FieldWidget
                className={styles["param-input"]}
                widget={WidgetType.MathValue}
                error={exprErrors[0].lhs?.details.paramErrors[i]}
                label={`Name for ${ordinal(i + 1)} parameter`}
                name={`${ordinal(i + 1)}-parameter-name`}
                value={assignments[0].params[i]}
                onChange={handlers.param[i]}
              />
            }
            rangeInput={
              <FieldWidget
                className={styles["param-input"]}
                widget={WidgetType.MathValue}
                label={
                  // @ts-expect-error need to figure out this error
                  config.properties[rangeProp].label
                }
                name={rangeProp}
                error={errors[rangeProp]}
                // @ts-expect-error need to figure out this error
                value={item.properties[rangeProp]}
                onChange={onWidgetChange}
              />
            }
          />
        ))}
      </ParameterContainer>
    </ItemTemplate>
  );
};

export default RangedMathItemForm;
