import { mathItemConfigs as configs, MathItemType as MIT } from "@/configs";

import React, { useId, useEffect } from "react";
import FieldWidget, { useOnWidgetChange } from "../../FieldWidget";
import ItemTemplate from "../../templates/ItemTemplate";
import { MathItemForm } from "../interfaces";
import styles from "./Camera.module.css";
import { useMathScope } from "../../mathItemsSlice";
import { useMathErrors, useMathItemResults } from "../../mathScope";
import { WidgetChangeEvent } from "../../FieldWidget/types";

const config = configs[MIT.Camera];

const configProps = config.properties;

const defaultCameraProps = config.make("fake").properties;

const controlsProps = [
  "isRotateEnabled",
  "isZoomEnabled",
  "isPanEnabled",
] as const;

const computedProps = [
  "useComputed",
  "computedPosition",
  "computedTarget",
] as const;
const errorNames = [
  ...controlsProps,
  ...computedProps,
  "isOrthographic",
] as const;

const Camera: MathItemForm<MIT.Camera> = ({ item }) => {
  const onWidgetChange = useOnWidgetChange(item);
  const id = useId();

  const mathScope = useMathScope();
  const errors = useMathErrors(mathScope, item.id, errorNames);
  const { useComputed = false } = useMathItemResults(mathScope, item, [
    "useComputed",
  ]);

  useEffect(() => {
    controlsProps.forEach((prop) => {
      const event: WidgetChangeEvent = {
        name: prop,
        value: useComputed ? "false" : defaultCameraProps[prop],
      };
      onWidgetChange(event);
    });
  }, [useComputed, onWidgetChange]);

  return (
    <ItemTemplate item={item} config={configs[MIT.Camera]}>
      <div>
        <div className={styles.form}>
          <div className={styles.header}>User-controlled camera:</div>
          {controlsProps.map((prop) => {
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
                  disabled={useComputed}
                  name={configProps[prop].name}
                  label={configProps[prop].label}
                  value={item.properties[prop]}
                  onChange={onWidgetChange}
                />
              </React.Fragment>
            );
          })}
          <div className={styles.divider} />
          <div className={styles.header}>Computed camera</div>
          {computedProps.map((prop) => {
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
          <div className={styles.divider} />
          <label
            id={`${id}-isOrthographic-label`}
            htmlFor={`${id}-isOrthographic-id`}
            className={styles["input-label"]}
          >
            {configProps.isOrthographic.label}
          </label>
          <FieldWidget
            aria-labelledby={`${id}-isOrthographic-label`}
            widget={configProps.isOrthographic.widget}
            itemId={item.id}
            error={errors.isOrthographic}
            name={configProps.isOrthographic.name}
            label={configProps.isOrthographic.label}
            value={item.properties.isOrthographic}
            onChange={onWidgetChange}
          />
        </div>
      </div>
    </ItemTemplate>
  );
};

export default Camera;
