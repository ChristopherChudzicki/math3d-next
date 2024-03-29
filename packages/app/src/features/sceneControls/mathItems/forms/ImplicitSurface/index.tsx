import {
  MathItemType as MIT,
  WidgetType,
  mathItemConfigs as configs,
} from "@math3d/mathitem-configs";
import React from "react";
import * as u from "@/util/styles/utils.module.css";
import FieldWidget from "../../FieldWidget";
import ReadonlyMathField from "../../FieldWidget/ReadonlyMathField";
import { ExpressionProps } from "../expressionHelpers";
import styles from "./ImplicitSurface.module.css";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["lhs", "rhs"] as const;

const config = configs[MIT.ImplicitSurface];

const ImplicitSurfaceExpressions: React.FC<ExpressionProps> = ({
  assignments,
  errors: exprErrors,
  handlers,
}) => {
  return (
    <div className={u.dFlex}>
      <FieldWidget
        className={styles.lhs}
        widget={WidgetType.MathValue}
        label={config.properties[exprNames[0]].label}
        name={exprNames[0]}
        error={exprErrors[0].rhs}
        value={assignments[0].rhs}
        onChange={handlers.rhs[0]}
      />
      <ReadonlyMathField value="=" />
      <div className={u.flex1}>
        <FieldWidget
          widget={WidgetType.MathValue}
          label={config.properties[exprNames[1]].label}
          name={exprNames[1]}
          error={exprErrors[1].rhs}
          value={assignments[1].rhs}
          onChange={handlers.rhs[1]}
        />
      </div>
    </div>
  );
};

const ImplicitSurface: MathItemForm<MIT.ImplicitSurface> = ({ item }) => (
  <RangedMathItemForm item={item} exprNames={exprNames}>
    {ImplicitSurfaceExpressions}
  </RangedMathItemForm>
);

export default ImplicitSurface;
