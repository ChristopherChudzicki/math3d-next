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
  /**
   * The color at `x`; `x` outside [0, 1] takes the nearer end's color, and
   * NaN is black.
   */
  getRGB: (x: number) => [number, number, number];
}

type ColorOrGradientConfig = ColorConfig | GradientConfig;

/**
 * RGB in [0, 1] at hue `h` (in turns, 0 to 1), full saturation, 50% lightness:
 * the "HSL to RGB alternative" formula in Wikipedia's "HSL and HSV".
 */
const hueRgb = (h: number): [number, number, number] => {
  const channel = (n: number) => {
    const k = (n + 12 * h) % 12;
    return 0.5 - 0.5 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [channel(0), channel(8), channel(4)];
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

const clamped =
  (unclamped: GradientConfig["getRGB"]): GradientConfig["getRGB"] =>
  (x) =>
    Number.isNaN(x) ? [0, 0, 0] : unclamped(Math.min(Math.max(x, 0), 1));

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
  getRGB: clamped((frac) => hueRgb(1 - frac)),
};
const bluered: GradientConfig = {
  type: "gradient",
  value: "bluered",
  label: "Blue to Red",
  backgroundPreview: "linear-gradient(to right, blue, red)",
  getRGB: clamped((frac) => [frac, 0, 1 - frac]),
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
  getRGB: clamped((frac) => hueRgb(0.666 * (1 - frac))),
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

/**
 * The predefined color or gradient for `text`, else a plain color config. A
 * color matches in any letter case; a gradient's name must match exactly, as
 * `isGradientName` does.
 */
const getColorConfig = (text: string) =>
  colorsAndGradients.find((c) =>
    c.type === "color"
      ? c.value.toLowerCase() === text.toLowerCase()
      : c.value === text,
  ) ?? makeColorConfig(text, "");

export type { ColorOrGradientConfig };

export {
  colors,
  colorsAndGradients,
  getColorConfig,
  gradients,
  isGradientName,
  makeColorConfig,
};
