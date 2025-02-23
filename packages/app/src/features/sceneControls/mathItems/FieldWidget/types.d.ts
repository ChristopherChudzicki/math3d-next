import { Parseable } from "@math3d/parser";
import React from "react";

interface IWidgetProps<V extends Parseable = string> {
  /**
   * used to access values; most items do not need it.
   */
  itemId?: string;
  name: string;
  label: string;
  "aria-labelledby"?: string;
  value: V;
  onChange: OnWidgetChange<V>;
  style?: React.CSSProperties;
  className?: string;
  error?: Error;
  onFocus?: React.FocusEventHandler;
  onBlur?: React.FocusEventHandler;
}

type PropertyValue = number | boolean | Parseable;

interface WidgetChangeEvent<V extends PropertyValue = PropertyValue> {
  name: string;
  value: V;
  oldValue?: V;
}
type OnWidgetChange<V extends PropertyValue = PropertyValue> = (
  e: WidgetChangeEvent<V>,
  clean?: boolean,
) => void;

export type { IWidgetProps, OnWidgetChange, WidgetChangeEvent, Parseable };
