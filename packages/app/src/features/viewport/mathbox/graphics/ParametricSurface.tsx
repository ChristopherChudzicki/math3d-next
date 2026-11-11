import React, { useCallback, useMemo, useState } from "react";
import * as MB from "mathbox-react";
import { Color } from "three";
import type { MathboxSelection, AreaEmitter, AreaProps } from "mathbox";
import {
  MathItemType as MIT,
  gradients,
  isGradientName,
} from "@math3d/mathitem-configs";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import { useDefaultZOrder } from "@/store/scene/evaluation/zOrders";
import {
  useFinalVisibility,
  useMathItemResults,
} from "@/store/scene/evaluation/mathScope";
import {
  domainMap,
  explicitPolarSurface,
  explicitSurface,
} from "@/features/viewport/shared/surfaceDomain";
import type { SurfaceDomain } from "@/features/viewport/shared/surfaceDomain";
import { explicitColorFunc } from "@/features/viewport/shared/surfaceColor";
import type { SurfaceColorFunc } from "@/features/viewport/shared/surfaceColor";
import { GraphicComponent } from "./interfaces";

const props = [
  "opacity",
  "zBias",
  "zIndex",
  "zOrder",
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
  domain?: SurfaceDomain;
  shaded?: boolean;
  func?: (u: number, v: number) => [number, number, number];
  colorFunc?: SurfaceColorFunc;
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
  zOrder,
}) => {
  const [dataNode, setData] = useState<MathboxSelection<"area"> | null>(null);
  const [colorNode, setColor] = useState<MathboxSelection<"area"> | null>(null);

  const uvFunc = useMemo(
    () =>
      domain
        ? domainMap(domain)
        : (U: number, V: number): [number, number] => [U, V],
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
          const [u, v] = uvFunc(U, V);
          const [r, g, b] = gradient.getRGB(colorFunc(...xyz, u, v));
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
  ]);

  const gridColor = useMemo(() => {
    if (hasColorFunc) return undefined;
    const c = new Color(color);
    return c.lerp(new Color("black"), 0.5).getHex();
  }, [hasColorFunc, color]);

  return !visible || !domain ? null : (
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
      {/* Gridlines share the surface's zOrder: MathBox rounds zOrder to an
          integer, and the next integer is the next graphic's. Among equal
          zOrders, three.js draws in mesh-creation order. */}
      {dataNode && (
        <MB.Group>
          <MB.Resample source={dataNode} height={grid2} />
          <MB.Line
            zBias={5}
            color={gridColor}
            width={gridWidth}
            opacity={gridOpacity}
            zOrder={zOrder}
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
            zOrder={zOrder}
          />
        </MB.Group>
      )}
    </MB.Group>
  );
};

const ParametricSurface: GraphicComponent<MIT.ParametricSurface> = ({
  item,
}) => {
  const scope = useMathScope();
  const defaultZOrder = useDefaultZOrder(item.id);
  const { color } = item.properties;
  const {
    expr: func,
    colorExpr: colorFunc,
    zOrder = defaultZOrder,
    ...others
  } = useMathItemResults(scope, item, props);

  const finalVisibility = useFinalVisibility(scope, item);
  return (
    <MathboxParametricSurface
      func={func}
      colorFunc={colorFunc}
      color={color}
      zOrder={zOrder}
      visible={finalVisibility}
      {...others}
    />
  );
};

const ExplicitSurface: GraphicComponent<MIT.ExplicitSurface> = ({ item }) => {
  const scope = useMathScope();
  const defaultZOrder = useDefaultZOrder(item.id);
  const { color } = item.properties;
  const {
    expr,
    colorExpr,
    zOrder = defaultZOrder,
    ...others
  } = useMathItemResults(scope, item, props);

  const func = useMemo(() => expr && explicitSurface(expr), [expr]);
  const colorFunc = useMemo(
    () => colorExpr && explicitColorFunc(colorExpr),
    [colorExpr],
  );
  const finalVisibility = useFinalVisibility(scope, item);
  return (
    <MathboxParametricSurface
      func={func}
      colorFunc={colorFunc}
      color={color}
      zOrder={zOrder}
      visible={finalVisibility}
      {...others}
    />
  );
};

const ExplicitSurfacePolar: GraphicComponent<MIT.ExplicitSurfacePolar> = ({
  item,
}) => {
  const scope = useMathScope();
  const defaultZOrder = useDefaultZOrder(item.id);
  const { color } = item.properties;
  const {
    expr,
    colorExpr: colorFunc,
    zOrder = defaultZOrder,
    ...others
  } = useMathItemResults(scope, item, props);

  const func = useMemo(() => expr && explicitPolarSurface(expr), [expr]);
  const finalVisibility = useFinalVisibility(scope, item);
  return (
    <MathboxParametricSurface
      func={func}
      colorFunc={colorFunc}
      color={color}
      zOrder={zOrder}
      visible={finalVisibility}
      {...others}
    />
  );
};

export { ParametricSurface, ExplicitSurface, ExplicitSurfacePolar };
