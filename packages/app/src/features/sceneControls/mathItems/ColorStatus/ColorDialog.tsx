import Tab from "@mui/material/Tab";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import {
  MathGraphic,
  WidgetType,
  colorsAndGradients,
  colors,
} from "@math3d/mathitem-configs";
import type { ParseableObjs } from "@math3d/parser";
import React, { useCallback, useState } from "react";
import ColorPicker, { OnColorChange } from "@/util/components/ColorPicker";

import FieldWidget, { useOnWidgetChange } from "../FieldWidget";
import { OnWidgetChange } from "../FieldWidget/types";
import { useMathScope } from "../mathItemsSlice";
import { useMathErrors } from "../mathScope";

type GraphicWithColorExpr = MathGraphic & {
  properties: { colorExpr: ParseableObjs["function-assignment"] };
};

const hasColorExpr = (
  graphic: MathGraphic
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
    [onChange, item.properties.colorExpr]
  );
  return (
    <div>
      <FieldWidget
        widget={WidgetType.MathValue}
        label="Color Expression"
        name="colorExpr"
        onChange={onWidgetChange}
        error={colorExpr}
        value={item.properties.colorExpr.rhs}
      />
    </div>
  );
};

interface ColorDialogProps {
  item: MathGraphic;
  className?: string;
}

const lessPadding = { padding: "0.5em" };

const ColorDialog: React.FC<ColorDialogProps> = (props) => {
  const { item } = props;
  const onWidgetChange = useOnWidgetChange(item);
  const onColorChange: OnColorChange = useCallback(
    (event) => onWidgetChange({ name: "color", value: event.value }),
    [onWidgetChange]
  );
  const pickerColors = hasColorExpr(item) ? colorsAndGradients : colors;
  const [tab, setTab] = useState("color");
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setTab(newValue);
    },
    []
  );
  return (
    <div role="dialog" className={props.className}>
      {hasColorExpr(item) ? (
        <TabContext value={tab}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Color" value="color" />
            <Tab label="Color Map" value="colormap" />
          </TabList>
          <TabPanel sx={lessPadding} value="color">
            <ColorPicker
              colors={pickerColors}
              value={item.properties.color}
              onChange={onColorChange}
            />
          </TabPanel>
          <TabPanel sx={lessPadding} value="colormap">
            <ColorExprInput item={item} onChange={onWidgetChange} />
          </TabPanel>
        </TabContext>
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
