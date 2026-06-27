// `MathItemType` is a const-object + same-named literal-union type, NOT a TS
// `enum`. It used to be a string `enum`, but string-enum members are *nominal*:
// `MathItemType.Point` is a distinct type identity from the string `"POINT"`, so
// the v1 client-sync check (packages/api/src/v1-sync.check.ts) could not assert
// strict equality between our discriminants and the generated client's
// string-literal discriminants. A literal union is structurally `"POINT"`, which
// unlocks that — and removes a class of nominal-identity friction enums cause.
//
// This deliberately mirrors what openapi-generator-cli emits for the same
// fields, e.g. `PointItemTypeEnum = { Point: "POINT" } as const` + a derived
// literal-union type — so the frontend source-of-truth and the generated client
// share one idiom.
//
// The `namespace` is the one wrinkle. TS namespaces are legacy syntax (the
// language discourages them), but here a type-only (non-instantiated, emits no
// runtime JS) namespace is the cleanest way to keep `MathItemType.Point` usable
// in *type* positions — e.g. `IMathItem<MathItemType.Point>` — exactly as the
// enum allowed. Without it, ~48 member-as-type call sites would each need
// `typeof MathItemType.Point`. The three same-named declarations merge:
//   - `const`     — value uses (`MathItemType.Point` -> "POINT", computed keys).
//   - `type`      — the bare union for annotations/constraints.
//   - `namespace` — member-as-type uses (`MathItemType.Point` as a type).
// The merge trips three lint rules that don't model declaration merging
// (import/export's multiple-export, no-redeclare) or intentionally forbid the
// syntax (no-namespace); disabled for this block only.
/* eslint-disable import/export, @typescript-eslint/no-redeclare, @typescript-eslint/no-namespace */
export const MathItemType = {
  Axis: "AXIS",
  BooleanVariable: "BOOLEAN_VARIABLE",
  Camera: "CAMERA",
  ExplicitSurface: "EXPLICIT_SURFACE",
  ExplicitSurfacePolar: "EXPLICIT_SURFACE_POLAR",
  Folder: "FOLDER",
  Grid: "GRID",
  ImplicitSurface: "IMPLICIT_SURFACE",
  Line: "LINE",
  Point: "POINT",
  ParametricCurve: "PARAMETRIC_CURVE",
  ParametricSurface: "PARAMETRIC_SURFACE",
  Variable: "VARIABLE",
  VariableSlider: "VARIABLE_SLIDER",
  Vector: "VECTOR",
  VectorField: "VECTOR_FIELD",
} as const;
export type MathItemType = (typeof MathItemType)[keyof typeof MathItemType];
export namespace MathItemType {
  export type Axis = typeof MathItemType.Axis;
  export type BooleanVariable = typeof MathItemType.BooleanVariable;
  export type Camera = typeof MathItemType.Camera;
  export type ExplicitSurface = typeof MathItemType.ExplicitSurface;
  export type ExplicitSurfacePolar = typeof MathItemType.ExplicitSurfacePolar;
  export type Folder = typeof MathItemType.Folder;
  export type Grid = typeof MathItemType.Grid;
  export type ImplicitSurface = typeof MathItemType.ImplicitSurface;
  export type Line = typeof MathItemType.Line;
  export type Point = typeof MathItemType.Point;
  export type ParametricCurve = typeof MathItemType.ParametricCurve;
  export type ParametricSurface = typeof MathItemType.ParametricSurface;
  export type Variable = typeof MathItemType.Variable;
  export type VariableSlider = typeof MathItemType.VariableSlider;
  export type Vector = typeof MathItemType.Vector;
  export type VectorField = typeof MathItemType.VectorField;
}
/* eslint-enable import/export, @typescript-eslint/no-redeclare, @typescript-eslint/no-namespace */

export enum WidgetType {
  Color = "color-picker",
  AutosizeText = "autosize-text",
  Text = "text",
  Custom = "custom",
  // Math widgets
  // Properties that use a math widget will be added to MathScope
  MathBoolean = "math-boolean",
  MathValue = "math-value",
  MathAssignment = "math-assignment",
  CustomMath = "custom-math",
}
