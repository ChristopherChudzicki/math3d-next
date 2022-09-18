import composeRefs from "@/util/composeRefs";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "@math3d/react-textarea-autosize";
import React, { useEffect, useRef, useState } from "react";

import TextMeasurer from "./TextMeasurer";

type Props = React.ComponentProps<typeof TextareaAutosize> & {
  value?: string;
  extraWidth?: number;
};

const textMeasurer = new TextMeasurer();

const TextareaAutoWidthHeight = React.forwardRef<HTMLTextAreaElement, Props>(
  (props, forwardedRef) => {
    /**
     * Strange issue with newlines. See https://github.com/Andarist/react-textarea-autosize/issues/340
     * Possible workaround...replace newlines with \s\n
     */
    const { onChange, style, extraWidth, ...otherProps } = props;

    const lines = (props.value ?? "").split("\n");
    const textarea = useRef<HTMLTextAreaElement>(null);
    const widths = !textarea.current
      ? [0]
      : textMeasurer.measure(lines, textarea.current).map((m) => m.width);

    const width = Math.max(...widths) + (extraWidth ?? 0);

    const [hasRendered, setHasRendered] = useState(false);
    useEffect(() => {
      if (!hasRendered) {
        setHasRendered(true);
      }
    }, [hasRendered]);

    const mergedStyle: TextareaAutosizeProps["style"] = {
      width: `${width}px`,
      ...style,
    };
    return (
      <TextareaAutosize
        aria-busy={!hasRendered}
        ref={composeRefs(forwardedRef, textarea)}
        style={mergedStyle}
        onChange={props.onChange}
        {...otherProps}
        // Don't show text until the width has been measured
        value={hasRendered ? props.value : ""}
      />
    );
  }
);
TextareaAutoWidthHeight.displayName = "TextareaAutoWidthHeight";

export default TextareaAutoWidthHeight;
