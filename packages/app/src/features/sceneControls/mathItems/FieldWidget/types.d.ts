import { Parseable } from "@/util/parsing";
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
  disabled?: boolean;
}

interface WidgetChangeEvent<V extends Parseable = string> {
  name: string;
  value: V;
  oldValue?: V;
}
type OnWidgetChange<V extends Parseable = string> = (
  e: WidgetChangeEvent<V>
) => void;

export type { IWidgetProps, OnWidgetChange, WidgetChangeEvent, Parseable };
