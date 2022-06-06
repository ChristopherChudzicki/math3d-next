import MathScope from "util/MathScope";

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
}

interface WidgetChangeEvent {
  name: string;
  value: string;
  mathScope?: MathScope;
}
type OnWidgetChange = (e: WidgetChangeEvent) => void;

export type { IWidgetProps, WidgetChangeEvent, OnWidgetChange };
