import { Tabs } from "antd";
import { MathGraphic, WidgetType } from "configs";
import { colors, colorsAndGradients } from "configs/colors";
import React, { useCallback } from "react";
import ColorPicker, { OnColorChange } from "util/components/ColorPicker";

import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { OnWidgetChange } from "../FieldWidget/types";
import { useMathScope } from "../mathItemsSlice";
import { useMathErrors } from "../mathScope";

const { TabPane } = Tabs;

type GraphicWithColorExpr = MathGraphic & {
  properties: { colorExpr: "string" };
};

const hasColorExpr = (
  graphic: MathGraphic
): graphic is GraphicWithColorExpr => {
  return "colorExpr" in graphic.properties;
};

interface ColorExprProps {
  onChange: OnWidgetChange;
  item: GraphicWithColorExpr;
}

const COLOR_EXPR = ["colorExpr"] as const;

const ColorExprInput: React.FC<ColorExprProps> = (props) => {
  const { onChange, item } = props;
  const mathScope = useMathScope();
  const { colorExpr } = useMathErrors(mathScope, item.id, COLOR_EXPR);
  return (
    <div>
      <FieldWidget
        widget={WidgetType.MathValue}
        title="Color Expression"
        name="colorExpr"
        onChange={onChange}
        error={colorExpr}
        value={item.properties.colorExpr}
      />
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
    [onWidgetChange]
  );
  const pickerColors = hasColorExpr(item) ? colorsAndGradients : colors;
  return (
    <div role="dialog" className={props.className}>
      {hasColorExpr(item) ? (
        <Tabs>
          <TabPane tab="Color" key="color">
            <ColorPicker
              colors={pickerColors}
              value={item.properties.color}
              onChange={onColorChange}
            />
          </TabPane>
          <TabPane tab="Color Map" key="colormap">
            <ColorExprInput item={item} onChange={onWidgetChange} />
          </TabPane>
        </Tabs>
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
