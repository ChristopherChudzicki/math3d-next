import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import classNames from "classnames";
import React, {
  MouseEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import tinycolor from "tinycolor2";

import styles from "./ColorPicker.module.css";

interface ColorWithStyle {
  backgroundPreview: string;
  value: string;
  label: string;
}

interface ColorPickerEvent {
  value: string;
}

interface ColorSquareProps {
  color: ColorWithStyle;
  textOnly?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const ColorSquare: React.FC<ColorSquareProps> = (props) => {
  const { color, onClick, textOnly = false } = props;

  const childProps = {
    "aria-label": color.label,
    style: { background: color.backgroundPreview },
    className: classNames(
      {
        [styles["text-color-swatch"]]: textOnly,
      },
      styles["color-swatch"]
    ),
  };
  if (onClick) {
    return <button type="button" {...childProps} onClick={onClick} />;
  }
  return <div {...childProps} />;
};

const ColorWarning: React.FC<{ value: string }> = ({ value }) => (
  <Tooltip arrow title={`${value} is not a valid color`}>
    <WarningAmberIcon />
  </Tooltip>
);

type OnColorChange = (event: ColorPickerEvent) => void;

interface ColorPickerProps {
  value: string;
  style?: React.CSSProperties;
  /**
   * Fired when a new color is picked, i.e,
   *  - a swatch is clicked
   *  - a *valid* color is entered in the text-entry
   */
  onChange?: OnColorChange;
  className?: string;
  colors: ColorWithStyle[];
}

/**
 * A color picker that:
 *  - displays swatches for predefined colors and gradients.
 *  - allows text-entry of colors for some freedom
 * Only predefined gradients are supported; users cannot create their own
 * gradients.
 */
const ColorPicker: React.FC<ColorPickerProps> = (props: ColorPickerProps) => {
  const { style, className, value, colors, onChange } = props;
  const [current, setCurrent] = useState(value);

  const normalizeColor = useCallback(
    (color: string | ColorWithStyle): ColorWithStyle => {
      if (typeof color === "string") {
        const propColor = colors.find((c) => c.value === color);
        if (propColor) return propColor;
        const hex = tinycolor(color).toHexString();
        return { value: hex, backgroundPreview: hex, label: color };
      }
      return color;
    },
    [colors]
  );

  const isValidColor = useCallback(
    (text: string): boolean => {
      if (colors.map((c) => c.value).includes(text)) return true;
      const tc = tinycolor(text);
      if (tc.getFormat() === "hex" && !text.startsWith("#")) return false;
      return tinycolor(text).isValid();
    },
    [colors]
  );

  const handleColor = useCallback(
    (colorString: string) => {
      setCurrent(colorString);
      if (isValidColor(colorString) && onChange) {
        const event: ColorPickerEvent = { value: colorString };
        onChange(event);
      }
    },
    [onChange, isValidColor]
  );
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => handleColor(e.target.value),
    [handleColor]
  );

  const InputProps = useMemo(() => {
    const adornment = (
      <InputAdornment position="start">
        {isValidColor(current) ? (
          <ColorSquare color={normalizeColor(current)} textOnly />
        ) : (
          <ColorWarning value={current} />
        )}
      </InputAdornment>
    );
    return { startAdornment: adornment };
  }, [current, isValidColor, normalizeColor]);

  return (
    <div
      style={style}
      className={classNames(styles["color-picker-grid"], className)}
    >
      {colors.map((c) => {
        return (
          <ColorSquare
            key={c.value}
            color={c}
            onClick={() => handleColor(c.value)}
          />
        );
      })}
      <TextField
        size="small"
        title="Custom Color"
        className={styles["color-input"]}
        onChange={handleChange}
        value={current}
        label="Custom Color"
        margin="dense"
        InputProps={InputProps}
      />
    </div>
  );
};

export type { OnColorChange };
export default ColorPicker;
