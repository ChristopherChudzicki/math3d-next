import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { OnChangeListener } from "@math3d/mathscope";
import * as select from "@/store/scene/state/selectors";
import type { AppParseable } from "@/store/scene/state/interfaces";
import { mathScopeId } from "./mathScope";
import { useMathScope } from "./useMathScope";

// MathBox's own default; an opacity that fails to evaluate reaches it unset.
const DEFAULT_OPACITY = 1;

const drawnOpacity = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(value, 1)
    : DEFAULT_OPACITY;

/**
 * MathBox draws higher zOrders later, and draws every material as transparent
 * with depth writes on. So anything drawn after a translucent graphic is
 * hidden wherever it lies behind it. More opaque graphics therefore go first;
 * ties keep their tree order.
 */
const orderByOpacity = (
  treeOrder: Record<string, number>,
  opacities: Record<string, unknown>,
): Record<string, number> => {
  const ids = Object.keys(treeOrder).sort(
    (a, b) =>
      drawnOpacity(opacities[b]) - drawnOpacity(opacities[a]) ||
      treeOrder[a] - treeOrder[b],
  );
  return Object.fromEntries(ids.map((id, index) => [id, index]));
};

/**
 * The zOrder each graphic gets when its own zOrder is empty, by evaluated
 * opacity and then tree order.
 */
const useDefaultGraphicOrder = (): Record<string, number> => {
  const scope = useMathScope();
  const treeOrder = useSelector(select.graphicTreeOrder);
  const ids = useMemo(() => Object.keys(treeOrder), [treeOrder]);
  const [opacities, setOpacities] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const scopeIds = ids.map((id) => mathScopeId(id, "opacity"));
    const read = () =>
      Object.fromEntries(
        ids.map((id, i) => [id, scope.results.get(scopeIds[i])]),
      );
    setOpacities(read());
    const onChange: OnChangeListener<AppParseable> = (event) => {
      const { touched } = event.detail.changes.results;
      if (scopeIds.some((id) => touched.has(id))) setOpacities(read());
    };
    scope.addEventListener("change", onChange);
    return () => {
      scope.removeEventListener("change", onChange);
    };
  }, [scope, ids]);

  return useMemo(
    () => orderByOpacity(treeOrder, opacities),
    [treeOrder, opacities],
  );
};

export { useDefaultGraphicOrder, orderByOpacity };
