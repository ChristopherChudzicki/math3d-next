import tinycolor from "tinycolor2";

interface ColorConfig {
  type: "color";
  value: string;
  label: string;
  backgroundPreview: string;
}

interface GradientConfig {
  type: "gradient";
  value: string;
  label: string;
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

const makeColorConfig = (text: string, label: string): ColorConfig => ({
  type: "color",
  value: text,
  backgroundPreview: text,
  label,
});

const colors: ColorConfig[] = [
  ["#33FF00", "Bright green"],
  ["#2ecc71", "Green"],
  ["#3090ff", "Blue"],
  ["#9b59b6", "Purple"],
  ["#8e44ad", "Deep Purple"],
  ["#2c3e50", "Navy"],
  ["#f1c40f", "Yellow"],
  ["#e67e22", "Orange"],
  ["#e74c3c", "Red"],
  ["#808080", "Gray"],
].map(([text, label]) => makeColorConfig(text, label));

const rainbow: GradientConfig = {
  type: "gradient",
  value: "rainbow",
  label: "Rainbow",
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
  label: "Blue to Red",
  backgroundPreview: "linear-gradient(to right, blue, red)",
  getRGB: (frac: number) => {
    return [frac, 0, 1 - frac];
  },
};

const temperature: GradientConfig = {
  type: "gradient",
  value: "temperature",
  label: "Temperature",
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
const isGradientName = (name: string): name is keyof typeof gradients => {
  return Object.keys(gradients).includes(name);
};

const colorsAndGradients = [...colors, ...[rainbow, bluered, temperature]];

export type { ColorOrGradientConfig };

export {
  colors,
  colorsAndGradients,
  gradients,
  isGradientName,
  makeColorConfig,
};
