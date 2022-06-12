import classNames from "classnames";
import React, {
  useCallback,
  useState,
  useEffect,
  MouseEventHandler,
} from "react";
import { Input, Tooltip } from "antd";
import tinycolor from "tinycolor2";
import { WarningOutlined } from "@ant-design/icons";
import styles from "./ColorPicker.module.css";

interface ColorWithStyle {
  backgroundPreview: string;
  value: string;
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

  // In the case of gradients, tinycolor object won't be valid
  const isLight = tinycolor(color.value).isLight();
  return (
    <button
      type="button"
      aria-label="Select Color"
      title="Select Color"
      onClick={onClick}
      style={{ background: color.backgroundPreview }}
      className={classNames(
        {
          [styles["light-colored-swatch"]]: isLight,
          [styles["text-color-swatch"]]: textOnly,
        },
        styles["color-swatch"]
      )}
    />
  );
};

const ColorWarning: React.FC<{ value: string }> = ({ value }) => (
  <Tooltip title={`${value} is not a valid color`}>
    <WarningOutlined />
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
        return { value: hex, backgroundPreview: hex };
      }
      return color;
    },
    [colors]
  );

  const isValidColor = useCallback(
    (text: string): boolean => {
      if (colors.map((c) => c.value).includes(text)) return true;
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

  useEffect(() => {
    // tribgger event when prop changes
    handleColor(value);
  }, [value, handleColor]);

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
      <Input
        prefix={
          isValidColor(current) ? (
            <ColorSquare color={normalizeColor(current)} textOnly />
          ) : (
            <ColorWarning value={current} />
          )
        }
        className={styles["color-input"]}
        onChange={handleChange}
        value={current}
      />
    </div>
  );
};

export type { OnColorChange };
export default ColorPicker;
