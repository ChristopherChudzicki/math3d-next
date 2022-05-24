import MathScope from "util/MathScope";

interface IWidgetProps {
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
