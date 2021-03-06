import {
  MathItem,
  mathItemConfigs as configs,
  MathItemType as MIT,
  WidgetType,
} from "configs";
import ordinal from "ordinal";
import React, { useMemo } from "react";

import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { OnWidgetChange } from "../FieldWidget/types";
import { useMathScope } from "../mathItemsSlice";
import { useMathErrors } from "../mathScope";
import ItemTemplate from "../templates/ItemTemplate";
import {
  ParameterContainer,
  ParameterForm,
  useExpressionAndParameters,
} from "./expressionHelpers";

interface GenericRangedMathItemFormProps<T extends MIT> {
  item: MathItem<T>;
  errorNames: readonly (keyof MathItem<T>["properties"] & string)[];
  rangePropNames: readonly (keyof MathItem<T>["properties"] & string)[];
}

type RangedMathItemFormProps =
  | GenericRangedMathItemFormProps<MIT.ParametricCurve>
  | GenericRangedMathItemFormProps<MIT.ParametricSurface>
  | GenericRangedMathItemFormProps<MIT.ExplicitSurface>
  | GenericRangedMathItemFormProps<MIT.ExplicitSurfacePolar>;

const RangedMathItemForm = ({
  item,
  rangePropNames,
  errorNames,
}: RangedMathItemFormProps) => {
  const config = configs[item.type];
  const onWidgetChange = useOnWidgetChange(item);
  const {
    onParamNameChange,
    onRhsChange,
    exprRef,
    paramNameErrors: paramErrors,
  } = useExpressionAndParameters(item.properties.expr, onWidgetChange);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);

  const onParamChanges = useMemo(
    () =>
      rangePropNames.map((_x, i) => {
        const cb: OnWidgetChange = (e) => onParamNameChange(e.value, i);
        return cb;
      }),
    [onParamNameChange, rangePropNames]
  );
  return (
    <ItemTemplate item={item} config={config}>
      <FieldWidget
        widget={WidgetType.MathValue}
        title={config.properties.expr.label}
        name="expr"
        error={errors.expr}
        value={exprRef.current.rhs}
        onChange={onRhsChange}
      />
      <ParameterContainer>
        {rangePropNames.map((rangeProp, i) => (
          <ParameterForm
            key={rangeProp}
            nameInput={
              <FieldWidget
                widget={WidgetType.MathValue}
                title={`Name for ${ordinal(i + 1)} parameter`}
                name={`${ordinal(i + 1)}-parameter-name`}
                error={paramErrors[i]}
                value={exprRef.current.params[i]}
                onChange={onParamChanges[i]}
              />
            }
            rangeInput={
              <FieldWidget
                widget={WidgetType.MathValue}
                // @ts-expect-error need to figure out this error
                title={config.properties[rangeProp].label}
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
