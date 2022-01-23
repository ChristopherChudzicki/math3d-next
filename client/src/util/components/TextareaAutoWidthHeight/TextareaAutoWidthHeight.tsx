import React, { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import TextMeasurer from "./TextMeasurer";

type Props = React.ComponentProps<typeof TextareaAutosize> & {
  value?: string;
  extraWidth?: number;
};

const textMeasurer = new TextMeasurer();

const TextareaAutoWidthHeight: React.FC<Props> = (props) => {
  const { onChange, style, extraWidth, ...otherProps } = props;

  const lines = (props.value ?? "").split("\n");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const widths =
    textarea.current === null
      ? [0]
      : textMeasurer.measure(lines, textarea.current).map((m) => m.width);

  const width = Math.max(...widths) + (extraWidth ?? 0);

  const [hasRendered, setHasRendered] = useState(false);
  useEffect(() => {
    setHasRendered(true);
  }, [hasRendered]);

  const mergedStyle: React.CSSProperties = {
    width: `${width}px`,
    ...style,
  };
  return (
    <TextareaAutosize
      ref={textarea}
      // TextareaAutosize.style type seems to have a bug... its type is Style not CSSProperties?
      // though...unclear to me why never works here
      style={mergedStyle as never}
      onChange={props.onChange}
      {...otherProps}
      // Don't show text until the width has been measured
      value={hasRendered ? props.value : ""}
    />
  );
};

export default TextareaAutoWidthHeight;
