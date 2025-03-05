export enum MathItemType {
  Axis = "AXIS",
  BooleanVariable = "BOOLEAN_VARIABLE",
  Camera = "CAMERA",
  ExplicitSurface = "EXPLICIT_SURFACE",
  ExplicitSurfacePolar = "EXPLICIT_SURFACE_POLAR",
  Folder = "FOLDER",
  Grid = "GRID",
  ImplicitSurface = "IMPLICIT_SURFACE",
  Line = "LINE",
  Point = "POINT",
  ParametricCurve = "PARAMETRIC_CURVE",
  ParametricSurface = "PARAMETRIC_SURFACE",
  Variable = "VARIABLE",
  VariableSlider = "VARIABLE_SLIDER",
  Vector = "VECTOR",
  VectorField = "VECTOR_FIELD",
}

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
