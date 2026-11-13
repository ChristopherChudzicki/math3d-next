import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  MathItemType,
  mathItemConfigs,
  type MathItemPatch,
} from "@math3d/mathitem-configs";
import { CONVENTIONS } from "./conventions";
import { evaluateScene, usesAny } from "./evaluateNext";

const variable = (rhs: string) => {
  const item = mathItemConfigs[MathItemType.Variable].make("v");
  return {
    ...item,
    properties: {
      ...item.properties,
      value: { type: "assignment", lhs: "v", rhs },
    },
  } as MathItemPatch;
};

const value = (rhs: string) =>
  evaluateScene({ items: [variable(rhs)] }).v.value;

describe("CONVENTIONS", () => {
  const { random } = Math;
  beforeAll(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterAll(() => {
    Math.random = random;
    vi.restoreAllMocks();
  });

  it.each([
    {
      convention: "round" as const,
      rhs: "\\operatorname{round}\\left(-1.5\\right)",
      next: -2,
      react: -1,
    },
    {
      convention: "complex_add" as const,
      rhs: "\\arg\\left(\\ln\\left(0\\right)+0\\cdot I\\right)",
      next: Math.PI / 4,
      react: Math.PI,
    },
    {
      convention: "complex_add" as const,
      rhs: "\\arg\\left(\\ln\\left(0\\right)-0\\cdot I\\right)",
      next: Math.PI / 4,
      react: Math.PI,
    },
    {
      convention: "principal_pow" as const,
      rhs: "\\left(-8\\right)^{\\frac{1}{3}}",
      next: -2,
      react: { re: expect.closeTo(1, 12), im: expect.closeTo(3 ** 0.5, 12) },
    },
    {
      convention: "principal_pow" as const,
      rhs: "\\left(-8\\right)^{\\frac{2}{3}}",
      next: expect.closeTo(4, 12),
      react: { re: expect.closeTo(-2, 12), im: expect.closeTo(12 ** 0.5, 12) },
    },
  ])(
    "$convention swaps in math3d-react's value of $rhs until undone",
    ({ convention, rhs, next, react }) => {
      expect(value(rhs)).toMatchObject({ status: "ok", value: next });
      const undo = CONVENTIONS[convention].install();
      try {
        expect(value(rhs)).toMatchObject({ status: "ok", value: react });
      } finally {
        undo();
      }
      expect(value(rhs)).toMatchObject({ status: "ok", value: next });
    },
  );

  it("finds a trigger anywhere in the scene's math", () => {
    const scene = {
      items: [variable("\\operatorname{round}\\left(2\\right)")],
    };
    expect(usesAny(scene, CONVENTIONS.round.triggers)).toBe(true);
    expect(usesAny(scene, CONVENTIONS.complex_add.triggers)).toBe(false);
  });

  it("finds a power that is not whole as written, and no other", () => {
    const { triggers } = CONVENTIONS.principal_pow;
    expect(usesAny({ items: [variable("x^{a}")] }, triggers)).toBe(true);
    expect(usesAny({ items: [variable("x^2+x^{-1}")] }, triggers)).toBe(false);
  });
});
