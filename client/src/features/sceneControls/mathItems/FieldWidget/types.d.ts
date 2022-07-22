import React from "react";

interface IWidgetProps {
  /**
   * used to access values; most items do not need it.
   */
  itemId?: string;
  name: string;
  title: string;
  value: string;
  onChange: OnWidgetChange;
  style?: React.CSSProperties;
  className?: string;
  error?: Error;
  onFocus?: React.FocusEventHandler;
  onBlur?: React.FocusEventHandler;
}

interface WidgetChangeEvent {
  name: string;
  value: string;
}
type OnWidgetChange = (e: WidgetChangeEvent) => void;

export type { IWidgetProps, OnWidgetChange, WidgetChangeEvent };
