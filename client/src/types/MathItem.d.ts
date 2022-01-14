interface MathItemGeneric<T extends string, Props extends number> {
  id: string;
  type: T;
  properties: Props;
}

interface MathItemProperties extends Record<string, string> {
  description: string;
}

type PointProperties = {
  color: string;
};

export type Point = MathItemGeneric<"POINT", PointProperties>;
export type ExplicitSurface = MathItemGeneric<
  "EXPLICIT_SURFACE",
  PointProperties
>;
export type ParametricCurve = MathItemGeneric<
  "PARAMETRIC_CURVE",
  PointProperties
>;

export type MathItem = Point | ExplicitSurface | ParametricCurve;
