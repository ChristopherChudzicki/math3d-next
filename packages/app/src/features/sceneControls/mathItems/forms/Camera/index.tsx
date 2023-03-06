import {
  mathItemConfigs as configs,
  MathItemType as MIT,
} from "@math3d/mathitem-configs";

import React, { useId } from "react";
import FieldWidget, { useOnWidgetChange } from "../../FieldWidget";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Camera.module.css";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors } from "../../mathScope";

const config = configs[MIT.Camera];

const configProps = config.properties;

const propNames = [
  "isRotateEnabled",
  "isZoomEnabled",
  "isPanEnabled",
  "position",
  "target",
  "useRelative",
  "updateOnDrag",
  "isOrthographic",
] as const;

const errorNames = propNames;

const Camera: MathItemForm<MIT.Camera> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const id = useId();

  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);

  return (
    <ItemTemplate item={item} config={configs[MIT.Camera]}>
      <div>
        <div className={styles.form}>
          {propNames.map((prop) => {
            if (prop === null) {
              return <div key={prop} className={styles.divider} />;
            }
            const elId = `${id}-${prop}`;
            const labelId = `${elId}-label`;
            return (
              <React.Fragment key={prop}>
                <label
                  id={labelId}
                  htmlFor={elId}
                  className={styles["input-label"]}
                >
                  {configProps[prop].label}
                </label>
                <FieldWidget
                  aria-labelledby={labelId}
                  widget={configProps[prop].widget}
                  itemId={item.id}
                  error={errors[prop]}
                  name={configProps[prop].name}
                  label={configProps[prop].label}
                  value={item.properties[prop]}
                  onChange={onWidgetChange}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </ItemTemplate>
  );
};

export default Camera;
