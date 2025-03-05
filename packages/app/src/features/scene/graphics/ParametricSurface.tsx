import React, { useCallback, useMemo, useState } from "react";
import * as MB from "mathbox-react";
import { Color } from "three";
import type { MathboxSelection, AreaEmitter, AreaProps } from "mathbox";
import {
  MathItemType as MIT,
  gradients,
  isGradientName,
} from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import {
  useFinalVisibility,
  useMathItemResults,
} from "../../sceneControls/mathItems/mathScope";
import { useMathScope } from "../../sceneControls/mathItems/sceneSlice";
import { GraphicComponent, AxesRange } from "./interfaces";
import { project } from "./util";

const props = [
  "opacity",
  "zBias",
  "zIndex",
  "samples1",
  "samples2",
  "grid1",
  "grid2",
  "gridWidth",
  "gridOpacity",
  "domain",
  "shaded",
  "expr",
  "colorExpr",
] as const;

const STATIC_COLOR_PROPS: AreaProps = {
  classes: ["colors"],
  channels: 4,
  items: 1,
  axes: [1, 2],
  live: false,
  rangeX: [0, 1],
  rangeY: [0, 1],
};

const RANGE_01: [number, number] = [0, 1];
const NORMALIZED_RANGE: AxesRange = [RANGE_01, RANGE_01, RANGE_01];

type MathboxParametricSurfaceProps = {
  visible?: boolean;
  opacity?: number;
  zBias?: number;
  zIndex?: number;
  zOrder?: number;
  samples1?: number;
  samples2?: number;
  grid1?: number;
  grid2?: number;
  gridWidth?: number;
  gridOpacity?: number;
  domain?: {
    value: [
      (param: number) => [number, number],
      (param: number) => [number, number],
    ];
    order: [number, number];
  };
  shaded?: boolean;
  func?: (u: number, v: number) => [number, number, number];
  range: AxesRange;
  colorFunc?: (X: number, Y: number, Z: number, u: number, v: number) => number;
  color?: string;
};

const MathboxParametricSurface: React.FC<MathboxParametricSurfaceProps> = ({
  visible,
  opacity,
  zBias,
  zIndex,
  samples1,
  samples2,
  grid1,
  grid2,
  gridWidth,
  gridOpacity,
  domain,
  shaded,
  func,
  colorFunc,
  color,
  range,
  zOrder,
}) => {
  const [dataNode, setData] = useState<MathboxSelection<"area"> | null>(null);
  const [colorNode, setColor] = useState<MathboxSelection<"area"> | null>(null);

  const uvFunc = useCallback(
    (UU: number, VV: number) => {
      if (!domain) return [UU, VV];
      const { order } = domain;
      const [fu, fv] = order.map((x) => domain.value[x]);
      const [u1, u2] = fu(0);
      const u = (U: number) => u1 + (u2 - u1) * U;
      const v = (U: number, V: number) => {
        const [v1, v2] = fv(u(U));
        return v1 + (v2 - v1) * V;
      };
      return order[0] === 0 ? [u(UU), v(UU, VV)] : [v(UU, VV), u(UU)];
    },
    [domain],
  );
  const xyzFunc = useCallback(
    (U: number, V: number) => {
      if (!func) return null;
      const [u, v] = uvFunc(U, V);
      return func(u, v);
    },
    [func, uvFunc],
  );

  const emitter: AreaEmitter = useCallback(
    (emit, UU, VV) => {
      const xyz = xyzFunc(UU, VV);
      if (!xyz) return;
      emit(...xyz);
    },
    [xyzFunc],
  );

  const hasColorFunc = !!(colorFunc && color && isGradientName(color));
  const colorProps: AreaProps = useMemo(() => {
    if (hasColorFunc) {
      const gradient = gradients[color];
      return {
        expr: (emit, U, V) => {
          const xyz = xyzFunc(U, V);
          if (!xyz) return;
          const [X, Y, Z] = project(xyz, range, NORMALIZED_RANGE);
          const [u, v] = uvFunc(U, V);
          const [r, g, b] = gradient.getRGB(colorFunc(X, Y, Z, u, v));
          emit(r, g, b, opacity ?? 1.0);
        },
        width: samples1,
        height: samples2,
      };
    }
    return {
      expr: (emit) => {
        const { r, g, b } = new Color(color);
        emit(r, g, b, opacity ?? 1.0);
      },
      width: 2,
      height: 2,
      channels: 4,
    };
  }, [
    hasColorFunc,
    color,
    opacity,
    xyzFunc,
    colorFunc,
    uvFunc,
    samples1,
    samples2,
    range,
  ]);

  const gridColor = useMemo(() => {
    if (hasColorFunc) return undefined;
    const c = new Color(color);
    return c.lerp(new Color("black"), 0.5).getHex();
  }, [hasColorFunc, color]);

  return !visible ? null : (
    <MB.Group>
      <MB.Area {...STATIC_COLOR_PROPS} {...colorProps} ref={setColor} />
      <MB.Area
        ref={setData}
        live={false}
        axes="xy"
        expr={emitter}
        width={samples1}
        height={samples2}
        channels={3}
        rangeX={RANGE_01}
        rangeY={RANGE_01}
      />
      {dataNode && (
        <MB.Surface
          points={dataNode}
          colors={colorNode}
          color="#FFFFFF"
          zBias={zBias}
          zIndex={zIndex}
          zOrder={zOrder}
          shaded={shaded}
        />
      )}
      {dataNode && (
        <MB.Group>
          <MB.Resample source={dataNode} height={grid2} />
          <MB.Line
            zBias={5}
            color={gridColor}
            width={gridWidth}
            opacity={gridOpacity}
            zOrder={(zOrder ?? 0) + 1}
          />
        </MB.Group>
      )}
      {dataNode && (
        <MB.Group>
          <MB.Resample source={dataNode} width={grid1} />
          <MB.Transpose order="yx" />
          <MB.Line
            zBias={5}
            color={gridColor}
            width={gridWidth}
            opacity={gridOpacity}
            zOrder={(zOrder ?? 0) + 1}
          />
        </MB.Group>
      )}
    </MB.Group>
  );
};

const ParametricSurface: GraphicComponent<MIT.ParametricSurface> = ({
  item,
  range,
  zOrder,
}) => {
  invariant(range);
  const scope = useMathScope();
  const { color } = item.properties;
  const {
    expr: func,
    colorExpr: colorFunc,
    ...others
  } = useMathItemResults(scope, item, props);

  const finalVisibility = useFinalVisibility(scope, item);
  return (
    <MathboxParametricSurface
      func={func}
      colorFunc={colorFunc}
      color={color}
      range={range}
      zOrder={zOrder}
      visible={finalVisibility}
      {...others}
    />
  );
};

const ExplicitSurface: GraphicComponent<MIT.ExplicitSurface> = ({
  item,
  range,
  zOrder,
}) => {
  invariant(range);
  const scope = useMathScope();
  const { color } = item.properties;
  const {
    expr,
    colorExpr: colorFunc,
    ...others
  } = useMathItemResults(scope, item, props);

  const func: MathboxParametricSurfaceProps["func"] = useMemo(() => {
    if (!expr) return undefined;
    return (x: number, y: number) => [x, y, +expr(x, y)];
  }, [expr]);
  const finalVisibility = useFinalVisibility(scope, item);
  return (
    <MathboxParametricSurface
      func={func}
      colorFunc={colorFunc}
      color={color}
      range={range}
      zOrder={zOrder}
      visible={finalVisibility}
      {...others}
    />
  );
};

const ExplicitSurfacePolar: GraphicComponent<MIT.ExplicitSurfacePolar> = ({
  item,
  range,
  zOrder,
}) => {
  invariant(range);
  const scope = useMathScope();
  const { color } = item.properties;
  const {
    expr,
    colorExpr: colorFunc,
    ...others
  } = useMathItemResults(scope, item, props);

  const func: MathboxParametricSurfaceProps["func"] = useMemo(() => {
    if (!expr) return undefined;
    return (r: number, q: number) => [
      r * Math.cos(q),
      r * Math.sin(q),
      expr(r, q),
    ];
  }, [expr]);
  const finalVisibility = useFinalVisibility(scope, item);
  return (
    <MathboxParametricSurface
      func={func}
      colorFunc={colorFunc}
      color={color}
      range={range}
      zOrder={zOrder}
      visible={finalVisibility}
      {...others}
    />
  );
};

export { ParametricSurface, ExplicitSurface, ExplicitSurfacePolar };
