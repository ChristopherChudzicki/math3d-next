import { useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { OnChangeListener } from "@math3d/mathscope";
import * as select from "@/store/scene/state/selectors";
import type {
  AppMathScope,
  AppParseable,
} from "@/store/scene/state/interfaces";
import { useMathScope } from "./useMathScope";

const OPACITY_SUFFIX = "-opacity";

// MathBox's own default, which a graphic whose opacity has never evaluated
// gets.
const DEFAULT_OPACITY = 1;

const drawnOpacity = (value: number | undefined) =>
  value !== undefined && Number.isFinite(value)
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
  opacities: ReadonlyMap<string, number>,
): Record<string, number> => {
  const ids = Object.keys(treeOrder).sort(
    (a, b) =>
      drawnOpacity(opacities.get(b)) - drawnOpacity(opacities.get(a)) ||
      treeOrder[a] - treeOrder[b],
  );
  return Object.fromEntries(ids.map((id, index) => [id, index]));
};

/**
 * Each graphic's last evaluated opacity, shared by every graphic in a scope.
 * Like useMathResults, it keeps the last value while an opacity errors,
 * because that is the opacity the graphic keeps drawing with.
 */
class OpacityStore {
  private opacities = new Map<string, number>();

  private listeners = new Set<() => void>();

  private cached?: {
    treeOrder: Record<string, number>;
    opacities: ReadonlyMap<string, number>;
    order: Record<string, number>;
  };

  constructor(scope: AppMathScope) {
    scope.results.forEach((value, id) => this.record(id, value));
    const onChange: OnChangeListener<AppParseable> = (event) => {
      let changed = false;
      event.detail.changes.results.touched.forEach((id) => {
        changed = this.record(id, scope.results.get(id)) || changed;
      });
      if (changed) this.listeners.forEach((listener) => listener());
    };
    scope.addEventListener("change", onChange);
  }

  private record(id: string, value: unknown): boolean {
    if (!id.endsWith(OPACITY_SUFFIX) || typeof value !== "number") {
      return false;
    }
    const itemId = id.slice(0, -OPACITY_SUFFIX.length);
    if (this.opacities.get(itemId) === value) return false;
    this.opacities = new Map(this.opacities).set(itemId, value);
    return true;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  order(treeOrder: Record<string, number>): Record<string, number> {
    const { cached, opacities } = this;
    if (cached?.treeOrder === treeOrder && cached.opacities === opacities) {
      return cached.order;
    }
    const order = orderByOpacity(treeOrder, opacities);
    this.cached = { treeOrder, opacities, order };
    return order;
  }
}

const stores = new WeakMap<AppMathScope, OpacityStore>();
const opacityStore = (scope: AppMathScope) => {
  let store = stores.get(scope);
  if (!store) {
    store = new OpacityStore(scope);
    stores.set(scope, store);
  }
  return store;
};

/**
 * The zOrder a graphic gets when its own zOrder is empty: by evaluated
 * opacity, then tree order. Undefined for a graphic outside the tree.
 */
const useDefaultZOrder = (itemId: string): number | undefined => {
  const store = opacityStore(useMathScope());
  const treeOrder = useSelector(select.graphicTreeOrder);
  return useSyncExternalStore(
    store.subscribe,
    () => store.order(treeOrder)[itemId],
  );
};

export { useDefaultZOrder, orderByOpacity };
