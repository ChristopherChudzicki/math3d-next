import { expect, test } from "vitest";
import { mathItemConfigs as configs, MathItemType as MIT } from "./index";
import type { PropertyConfig } from "./index";

test.each([
  { type: MIT.ParametricCurve, fields: ["samples1"], cap: 16384 },
  { type: MIT.ExplicitSurface, fields: ["samples1", "samples2"], cap: 1024 },
  {
    type: MIT.ExplicitSurfacePolar,
    fields: ["samples1", "samples2"],
    cap: 1024,
  },
  { type: MIT.ParametricSurface, fields: ["samples1", "samples2"], cap: 1024 },
  { type: MIT.ImplicitSurface, fields: ["samples"], cap: 192 },
  {
    type: MIT.VectorField,
    fields: ["samples1", "samples2", "samples3"],
    cap: 128,
  },
])(
  "$type accepts positive sample counts up to $cap",
  ({ type, fields, cap }) => {
    const { properties } = configs[type] as unknown as {
      properties: Record<string, PropertyConfig<string, unknown>>;
    };
    fields.forEach((field) => {
      const { validate } = properties[field];
      expect(validate?.(cap, {} as never)).toBe(cap);
      expect(() => validate?.(cap + 1, {} as never)).toThrow(
        `Samples must be at most ${cap}`,
      );
      expect(() => validate?.(0, {} as never)).toThrow(
        "must be a positive number",
      );
    });
  },
);
