import React, { CSSProperties } from "react";
import tinycolor from "tinycolor2";

interface ColorConfig {
  type: "color";
  value: string;
  backgroundPreview: string;
}

interface GradientConfig {
  type: "gradient";
  value: string;
  backgroundPreview: string;
  getRGB: (x: number) => [number, number, number];
}

type ColorOrGradientConfig = ColorConfig | GradientConfig;

const toFractionRgb = ({
  r,
  g,
  b,
}: {
  r: number;
  b: number;
  g: number;
}): [number, number, number] => {
  return [r / 255, g / 255, b / 255];
};

const colors: ColorConfig[] = [
  "#33FF00",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#8e44ad",
  "#2c3e50",
  "#f1c40f",
  "#e67e22",
  "#e74c3c",
  "#808080",
].map((color) => ({
  type: "color",
  value: color,
  backgroundPreview: color,
}));

const rainbow: GradientConfig = {
  type: "gradient",
  value: "rainbow",
  backgroundPreview: `linear-gradient(
    to right,
    hsl(360, 100%, 50%),
    hsl(300, 100%, 50%),
    hsl(240, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(0, 100%, 50%)
  )
  `,
  getRGB: (frac: number) => {
    const color = tinycolor.fromRatio({ h: 1 - frac, s: 1, l: 0.5 });
    return toFractionRgb(color.toRgb());
  },
};
const bluered: GradientConfig = {
  type: "gradient",
  value: "bluered",
  backgroundPreview: "linear-gradient(to right, blue, red)",
  getRGB: (frac: number) => {
    return [frac, 0, 1 - frac];
  },
};

const temperature: GradientConfig = {
  type: "gradient",
  value: "temperature",
  backgroundPreview: `linear-gradient(
    to right,
    hsl(240, 100%, 50%),
    hsl(180, 100%, 50%),
    hsl(120, 100%, 50%),
    hsl(60, 100%, 50%),
    hsl(0, 100%, 50%)
  )`,
  getRGB: (frac: number) => {
    const color = tinycolor.fromRatio({
      h: 0.666 * (1 - frac),
      s: 1,
      l: 0.5,
    });
    return toFractionRgb(color.toRgb());
  },
};

const gradients = {
  rainbow,
  bluered,
  temperature,
};

export type { ColorOrGradientConfig };

export { colors, gradients };
