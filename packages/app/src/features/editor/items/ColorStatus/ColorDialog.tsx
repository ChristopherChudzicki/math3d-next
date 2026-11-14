import {
  MathGraphic,
  colorsAndGradients,
  colors,
  gradients,
  isGradientName,
  mathItemConfigs as configs,
  MathItemType as MIT,
} from "@math3d/mathitem-configs";
import type { ParseableObjs } from "@math3d/parser";
import React, { useCallback, useId, useState } from "react";
import ColorPicker, { OnColorChange } from "@/ui/ColorPicker";
import { Tabs } from "@/ui/Tabs";

// Not from FieldWidget's index: it renders ColorWidget, which renders this.
import { useOnWidgetChange } from "@/features/editor/items/FieldWidget/hooks";
import ErrorTooltip from "@/features/editor/items/FieldWidget/ErrorTooltip";
import MathValue from "@/features/editor/items/FieldWidget/MathValue";
import { OnWidgetChange } from "@/features/editor/items/FieldWidget/types";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import {
  useMathErrors,
  useMathResults,
} from "@/store/scene/evaluation/mathScope";
import MathBoolean from "@/features/editor/items/FieldWidget/MathBoolean";
import ReadonlyMathField from "@/features/editor/items/FieldWidget/ReadonlyMathField";
import * as u from "@/util/styles/utils.module.css";
import styles from "./ColorDialog.module.css";

type GraphicWithColorExpr = MathGraphic & {
  properties: {
    colorExpr: ParseableObjs["function-assignment"];
    wrapColors: string;
  };
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
      <ErrorTooltip error={colorExpr}>
        <MathValue
          label="Color Expression"
          name="colorExpr"
          className={styles.expression}
          onChange={onWidgetChange}
          error={colorExpr}
          value={item.properties.colorExpr.rhs}
        />
      </ErrorTooltip>
    </div>
  );
};

const WRAP_COLORS = ["wrapColors"] as const;

/**
 * The selected gradient, the wrap setting and what it does; with a solid
 * color, a pointer to the gradients.
 */
const ColorMapOptions: React.FC<{
  item: GraphicWithColorExpr;
  onChange: OnWidgetChange<string>;
}> = ({ item, onChange }) => {
  const mathScope = useMathScope();
  const { wrapColors: error } = useMathErrors(mathScope, item.id, WRAP_COLORS);
  // Undefined when invalid, which clamps.
  const { wrapColors: wraps = false } = useMathResults(
    mathScope,
    item.id,
    WRAP_COLORS,
  );
  const labelId = useId();
  const helpId = useId();
  const { color } = item.properties;
  if (!isGradientName(color)) {
    return (
      <p className={styles.help}>
        Pick a gradient on the Color tab to color by f.
      </p>
    );
  }
  return (
    <div className={styles.options}>
      <div
        className={styles.gradient}
        style={{ background: gradients[color].backgroundPreview }}
        role="img"
        aria-label={`${gradients[color].label}, from 0 to 1`}
      />
      <div className={styles.ends} aria-hidden="true">
        <span>0</span>
        <span>1</span>
      </div>
      <div className={styles.wrap}>
        <span id={labelId}>Wrap</span>
        <ErrorTooltip error={error}>
          <MathBoolean
            itemId={item.id}
            name="wrapColors"
            label={configs[MIT.ParametricSurface].properties.wrapColors.label}
            aria-labelledby={labelId}
            aria-describedby={helpId}
            value={item.properties.wrapColors}
            onChange={onChange}
            error={error}
          />
        </ErrorTooltip>
      </div>
      <p id={helpId} className={styles.help}>
        Colors outside{" "}
        {/* MathLive's rendered math has no accessible text, so a copy reads it. */}
        <span aria-hidden="true">
          <ReadonlyMathField value="[0, 1]" className={styles.interval} />
        </span>
        <span className={u.visuallyHidden}>[0, 1]</span>{" "}
        {wraps
          ? "wrap: 1.25 is the same color as 0.25."
          : "take the end colors: 1.25 is the same color as 1."}
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
            <ColorMapOptions item={item} onChange={onWidgetChange} />
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
