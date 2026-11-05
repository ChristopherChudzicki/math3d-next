import type React from "react";
import { createContext, useContext, useLayoutEffect } from "react";
import type { MathGraphic, MathGraphicType } from "@math3d/mathitem-configs";
import type { GraphicSpec } from "./types";

type Report = (id: string, spec: GraphicSpec | null) => void;

export const SpecCollector = createContext<Report>(() => {});

/** Report `spec` while mounted; `null` while the graphic has nothing to draw. */
export const useReportSpec = (id: string, spec: GraphicSpec | null) => {
  const report = useContext(SpecCollector);
  useLayoutEffect(() => {
    report(id, spec);
    return () => report(id, null);
  }, [report, id, spec]);
};

export type SpecProps<T extends MathGraphicType> = {
  item: MathGraphic<T>;
};

/** Reports one graphic's spec to the `SpecCollector`; renders nothing. */
export type SpecComponent<T extends MathGraphicType> = React.FC<SpecProps<T>>;
