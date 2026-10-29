import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  MathItemType,
  mathItemConfigs,
  type MathItemPatch,
} from "@math3d/mathitem-configs";
import { evaluateScene } from "./evaluateNext";

const make = <T extends MathItemType>(
  type: T,
  id: string,
  properties: Record<string, unknown> = {},
) => {
  const item = mathItemConfigs[type].make(id);
  return {
    ...item,
    properties: { ...item.properties, ...properties },
  } as MathItemPatch;
};

describe("evaluateScene", () => {
  const { random } = Math;
  beforeAll(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterAll(() => {
    Math.random = random;
    vi.restoreAllMocks();
  });

  const result = () =>
    evaluateScene({
      items: [
        make(MathItemType.Variable, "a", {
          value: { type: "assignment", lhs: "a", rhs: "1" },
        }),
        make(MathItemType.Variable, "f", {
          value: { type: "assignment", lhs: "f(x)", rhs: "x^2+" },
        }),
        make(MathItemType.Variable, "h", {
          value: { type: "assignment", lhs: "h(x)", rhs: "x^2" },
        }),
        make(MathItemType.Variable, "y", {
          value: { type: "assignment", lhs: "y", rhs: "f(2)" },
        }),
        make(MathItemType.Point, "p", {
          coords: "\\left[a,qq,0\\right]",
        }),
        make(MathItemType.ParametricCurve, "c", {
          expr: {
            type: "function-assignment",
            name: "_f",
            params: ["t"],
            rhs: "\\left[t,\\operatorname{diff}(h)(t),0\\right]",
          },
        }),
        make(MathItemType.VariableSlider, "s", {
          range: { type: "array", items: ["-5", "qq"] },
        }),
        make(MathItemType.Point, "q", { coords: "\\left[1,2" }),
        make(MathItemType.ExplicitSurface, "e"),
      ],
    });

  it("tags each field with its stage", () => {
    const r = result();
    expect(r.a.value).toMatchObject({ status: "ok", value: 1 });
    expect(r.p.coords).toMatchObject({ status: "eval", deps: ["a-value"] });
    expect(r.q.coords.status).toBe("parse");
    // realFunc calls the function while validating; an error from its body
    // (here diff(h)·t, a function times a number) is an evaluation error.
    expect(r.c.expr.status).toBe("eval");
  });

  it("keeps deps on an assignment whose right-hand side fails to parse", () => {
    const r = result();
    expect(r.f.value.status).toBe("parse");
    expect(r.y.value).toMatchObject({ status: "eval", deps: ["f-value"] });
  });

  it("reports array elements separately", () => {
    const { elements } = result().s.range;
    expect(elements).toEqual([
      { status: "ok" },
      { status: "eval", message: expect.stringContaining("qq") },
    ]);
  });

  it("reports a surface domain's functions without their order", () => {
    const { domain } = result().e;
    expect(domain.status).toBe("ok");
    expect(domain.value).toEqual([
      { fn: 1, at: expect.any(Array) },
      { fn: 1, at: expect.any(Array) },
    ]);
  });
});
