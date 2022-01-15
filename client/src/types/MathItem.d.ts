interface MathItemGeneric<T extends string, Props extends MathItemProperties> {
  id: string;
  type: T;
  properties: Props;
}

interface MathItemProperties extends Record<string, string> {
  description: string;
}

type PointProperties = {
  description: string;
  color: string;
};

type FolderPoperties = {
  description: string;
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

export type Folder = MathItemGeneric<"FOLDER", FolderPoperties>;

export type MathGraphic = Point | ExplicitSurface | ParametricCurve;

export type MathItem = MathGraphic | Folder;
