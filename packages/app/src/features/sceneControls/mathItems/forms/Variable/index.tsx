import React from "react";
import {
  MathItem,
  mathItemConfigs as configs,
  MathItemType as MIT,
} from "@math3d/mathitem-configs";
import { toLaTeX } from "@math3d/mathjs-utils";

import * as u from "@/util/styles/utils.module.css";
import classNames from "classnames";
import { MathAssignment, useOnWidgetChange } from "../../FieldWidget";
import { useMathScope } from "../../sceneSlice";
import { useMathErrors, useMathItemResults } from "../../mathScope";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import ReadonlyMathField from "../../FieldWidget/ReadonlyMathField";
import styles from "./Variable.module.css";

const config = configs[MIT.Variable];

const configProps = config.properties;

const errorNames = ["value"] as const;
const valueNames = ["value"] as const;

type ValueDisplayProps = {
  item: MathItem<MIT.Variable>;
  className?: string;
};
/**
 * Show the value of a Variable item if it is scalar/vector/matrix.
 *
 * This is a separate component from the Variable form itself since it could
 * update much more often.
 */
const ValueDisplay: React.FC<ValueDisplayProps> = ({ item, className }) => {
  const mathScope = useMathScope();
  const { value } = useMathItemResults(mathScope, item, valueNames);
  const latex = toLaTeX(value);
  if (!latex) return null;
  return <ReadonlyMathField className={className} value={latex} />;
};

const Variable: MathItemForm<MIT.Variable> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  return (
    <ItemTemplate item={item} config={config}>
      <MathAssignment
        lhsClassName={styles.lhs}
        rhsClassName={styles.rhs}
        label={configProps.value.label}
        error={errors.value}
        name="value"
        value={item.properties.value}
        onChange={onWidgetChange}
      />
      <div className={classNames(u.dFlex, u.justifyContentEnd)}>
        <ValueDisplay item={item} className={styles.display} />
      </div>
    </ItemTemplate>
  );
};

export default Variable;
