import { useSyncExternalStore } from "react";
import { useSelector } from "react-redux";
import type { OnChangeListener } from "@math3d/mathscope";
import * as select from "@/store/scene/state/selectors";
import type {
  AppMathScope,
  AppParseable,
} from "@/store/scene/state/interfaces";
import { mathScopeId } from "./mathScope";
import { useMathScope } from "./useMathScope";

// Every opacity's MathScope id ends with this.
const OPACITY_SUFFIX = mathScopeId("", "opacity");

// The opacity a graphic draws with before its opacity has evaluated.
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
  opacityOf: (itemId: string) => number | undefined,
): Record<string, number> => {
  const ids = Object.keys(treeOrder).sort(
    (a, b) =>
      drawnOpacity(opacityOf(b)) - drawnOpacity(opacityOf(a)) ||
      treeOrder[a] - treeOrder[b],
  );
  return Object.fromEntries(ids.map((id, index) => [id, index]));
};

const isOpacity = (id: string, value: unknown): value is number =>
  id.endsWith(OPACITY_SUFFIX) && typeof value === "number";

/**
 * Each graphic's last evaluated opacity, shared by every graphic in a scope.
 * Like useMathResults, it keeps the last value while an opacity errors,
 * because that is the opacity the graphic keeps drawing with.
 */
class OpacityStore {
  // Keyed by MathScope id.
  private opacities = new Map<string, number>();

  private listeners = new Set<() => void>();

  private cached?: {
    treeOrder: Record<string, number>;
    opacities: ReadonlyMap<string, number>;
    order: Record<string, number>;
  };

  constructor(scope: AppMathScope) {
    scope.results.forEach((value, id) => {
      if (isOpacity(id, value)) this.opacities.set(id, value);
    });
    const onChange: OnChangeListener<AppParseable> = (event) => {
      let next: Map<string, number> | undefined;
      event.detail.changes.results.touched.forEach((id) => {
        const value = scope.results.get(id);
        if (isOpacity(id, value) && this.opacities.get(id) !== value) {
          next ??= new Map(this.opacities);
          next.set(id, value);
        }
      });
      if (next) {
        this.opacities = next;
        this.listeners.forEach((listener) => listener());
      }
    };
    scope.addEventListener("change", onChange);
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
    const order = orderByOpacity(treeOrder, (itemId) =>
      opacities.get(mathScopeId(itemId, "opacity")),
    );
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
