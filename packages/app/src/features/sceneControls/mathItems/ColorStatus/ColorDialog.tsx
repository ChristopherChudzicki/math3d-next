import {
  MathGraphic,
  WidgetType,
  colorsAndGradients,
  colors,
} from "@math3d/mathitem-configs";
import type { ParseableObjs } from "@math3d/parser";
import React, { useCallback, useState } from "react";
import ColorPicker, { OnColorChange } from "@/ui/ColorPicker";
import { Tabs } from "@/ui/Tabs";

import StaticMath from "@/ui/MathLive/StaticMath";
import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { OnWidgetChange } from "../FieldWidget/types";
import { useMathScope } from "../sceneSlice";
import { useMathErrors } from "../mathScope";
import ReadonlyMathField from "../FieldWidget/ReadonlyMathField";
import styles from "./ColorDialog.module.css";

type GraphicWithColorExpr = MathGraphic & {
  properties: { colorExpr: ParseableObjs["function-assignment"] };
};

const hasColorExpr = (
  graphic: MathGraphic,
): graphic is GraphicWithColorExpr => {
  return "colorExpr" in graphic.properties;
};

interface ColorExprProps {
  onChange: OnWidgetChange<ParseableObjs["function-assignment"]>;
  item: GraphicWithColorExpr;
}

const COLOR_EXPR = ["colorExpr"] as const;

const ColorExprInput: React.FC<ColorExprProps> = (props) => {
  const { onChange, item } = props;
  const mathScope = useMathScope();
  const { colorExpr } = useMathErrors(mathScope, item.id, COLOR_EXPR);
  const onWidgetChange: OnWidgetChange<string> = useCallback(
    (e) => {
      onChange({
        name: "colorExpr",
        value: {
          ...item.properties.colorExpr,
          rhs: e.value,
        },
      });
    },
    [onChange, item.properties.colorExpr],
  );
  const lhs = `f(${item.properties.colorExpr.params.join(", ")}) =`;
  return (
    <div>
      <ReadonlyMathField value={lhs} />
      <FieldWidget
        widget={WidgetType.MathValue}
        label="Color Expression"
        name="colorExpr"
        className={styles.expression}
        onChange={onWidgetChange}
        error={colorExpr}
        value={item.properties.colorExpr.rhs}
      />
      <p className={styles.note}>
        Note: <StaticMath value="X, Y, Z" mode="inline" /> (capitals) refer to
        normalized coordinates ranging from 0 to 1.
      </p>
    </div>
  );
};

interface ColorDialogProps {
  item: MathGraphic;
  className?: string;
}

const ColorDialog: React.FC<ColorDialogProps> = (props) => {
  const { item } = props;
  const onWidgetChange = useOnWidgetChange(item);
  const onColorChange: OnColorChange = useCallback(
    (event) => onWidgetChange({ name: "color", value: event.value }),
    [onWidgetChange],
  );
  const pickerColors = hasColorExpr(item) ? colorsAndGradients : colors;
  const [tab, setTab] = useState("color");
  return (
    <div className={props.className}>
      {hasColorExpr(item) ? (
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List aria-label="Color mode">
            <Tabs.Tab value="color">Color</Tabs.Tab>
            <Tabs.Tab value="colormap">Color Map</Tabs.Tab>
          </Tabs.List>
          {/* Base UI makes panels tab stops; these start with controls. */}
          <Tabs.Panel value="color" className={styles.panel} tabIndex={-1}>
            <ColorPicker
              colors={pickerColors}
              value={item.properties.color}
              onChange={onColorChange}
            />
          </Tabs.Panel>
          <Tabs.Panel value="colormap" className={styles.panel} tabIndex={-1}>
            <ColorExprInput item={item} onChange={onWidgetChange} />
          </Tabs.Panel>
        </Tabs.Root>
      ) : (
        <ColorPicker
          colors={pickerColors}
          value={item.properties.color}
          onChange={onColorChange}
        />
      )}
    </div>
  );
};

export default ColorDialog;
