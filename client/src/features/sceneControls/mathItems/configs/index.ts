import {MathItemType as MT, MathItemConfig} from 'types/mathItem' 
import axisConfig from './axis'
import booleanVariableConfig from './booleanVariable'
import cameraConfig from './camera'
import explicitSurfaceConfig from './explicitSurface'
import explicitSurfacePolarConfig from './explicitSurfacePolar'
import folderConfig from './folder'
import gridConfig from './grid'
import implicitSurfaceConfig from './implicitSurface'
import lineConfig from './line'
import parametricCurveConfig from './parametricCurve'
import parametricSurfaceConfig from './parametricSurface'
import pointConfig from './point'
import variableConfig from './variable'
import variableSliderConfig from './variableSlider'
import vectorConfig from './vector'
import vectorFieldConfig from './vectorField'

const configs: Record<MT, MathItemConfig> = {
  [MT.Axis]: axisConfig,
  [MT.BooleanVariable]: booleanVariableConfig,
  [MT.Camera]: cameraConfig,
  [MT.ExplicitSurface]: explicitSurfaceConfig,
  [MT.ExplicitSurfacePolar]: explicitSurfacePolarConfig,
  [MT.Folder]: folderConfig,
  [MT.Grid]: gridConfig,
  [MT.ImplicitSurface]: implicitSurfaceConfig,
  [MT.Line]: lineConfig,
  [MT.ParametricCurve]: parametricCurveConfig,
  [MT.ParametricSurface]: parametricSurfaceConfig,
  [MT.Point]: pointConfig,
  [MT.Variable]: variableConfig,
  [MT.VariableSlider]: variableSliderConfig,
  [MT.Vector]: vectorConfig,
  [MT.VectorField]: vectorFieldConfig
}

export default configs