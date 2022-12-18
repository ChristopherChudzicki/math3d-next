import React, { useEffect, useRef, forwardRef } from "react";

const MockComponent = forwardRef((props, ref) => {
  const divRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!divRef.current) return;
    // @ts-expect-error hack to mack props visible during tests
    divRef.current.$props = props;
    // @ts-expect-error hack to mack ref visible during tests
    divRef.current.$ref = ref;
  });
  return <div ref={divRef} />;
});
MockComponent.displayName = "MockComponent";

export const Area = MockComponent;

const MBArray = MockComponent;

export { MBArray as Array };

export const Axis = MockComponent;

export const Camera = MockComponent;

export const Cartesian = MockComponent;

export const Cartesian4 = MockComponent;

export const Clamp = MockComponent;

export const Clock = MockComponent;

export const Compose = MockComponent;

export const Dom = MockComponent;

export const Face = MockComponent;

export const Format = MockComponent;

export const Fragment = MockComponent;

export const Grid = MockComponent;

export const Group = MockComponent;

export const Grow = MockComponent;

export const Html = MockComponent;

export const Inherit = MockComponent;

export const Interval = MockComponent;

export const Join = MockComponent;

export const Label = MockComponent;

export const Layer = MockComponent;

export const Lerp = MockComponent;

export const Line = MockComponent;

export const Mask = MockComponent;

export const Matrix = MockComponent;

export const Memo = MockComponent;

export const Move = MockComponent;

export const Now = MockComponent;

export const Play = MockComponent;

export const Point = MockComponent;

export const Polar = MockComponent;

export const Present = MockComponent;

export const Readback = MockComponent;

export const Repeat = MockComponent;

export const Resample = MockComponent;

export const Retext = MockComponent;

export const Reveal = MockComponent;

export const Rtt = MockComponent;

export const Scale = MockComponent;

export const Shader = MockComponent;

export const Slice = MockComponent;

export const Slide = MockComponent;

export const Spherical = MockComponent;

export const Split = MockComponent;

export const Spread = MockComponent;

export const Step = MockComponent;

export const Stereographic = MockComponent;

export const Stereographic4 = MockComponent;

export const Strip = MockComponent;

export const Subdivide = MockComponent;

export const Surface = MockComponent;

export const Swizzle = MockComponent;

export const Text = MockComponent;

export const Ticks = MockComponent;

export const Transform = MockComponent;

export const Transform4 = MockComponent;

export const Transpose = MockComponent;

export const Unit = MockComponent;

export const Vector = MockComponent;

export const Vertex = MockComponent;

export const View = MockComponent;

export const Volume = MockComponent;

export const Voxel = MockComponent;

export const Mathbox = MockComponent;
