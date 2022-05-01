import React from 'react'
import { Widget } from '../configs'

const PlaceholderInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => <input {...props} />

const MathValue = PlaceholderInput

const MathBoolean = PlaceholderInput

const ColorPicker = PlaceholderInput


type FormWidgetProps = React.InputHTMLAttributes<HTMLInputElement> & {
  widget: Widget
}

const getComponentForWidget = (widget: Widget) =>{
  if (widget === Widget.MathValue) return MathValue
  if (widget === Widget.MathBoolean) return MathBoolean
  if (widget === Widget.Color) return ColorPicker
  throw new Error(`Unrecognized form widget: ${widget}`)
}

const FieldWidget: React.FC<FormWidgetProps> = (props) => {
  const { widget, ...otherProps } = props
  const WidgetComponent = getComponentForWidget(widget)
  return <WidgetComponent {...otherProps} />
}

export default FieldWidget