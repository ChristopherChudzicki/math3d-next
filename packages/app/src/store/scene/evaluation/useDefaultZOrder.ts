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

// Every zOrder's MathScope id ends with this.
const Z_ORDER_SUFFIX = mathScopeId("", "zOrder");

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

const isOrdering = (id: string, value: unknown): value is number =>
  (id.endsWith(OPACITY_SUFFIX) || id.endsWith(Z_ORDER_SUFFIX)) &&
  typeof value === "number";

/**
 * Each graphic's last evaluated opacity and zOrder, shared by every graphic
 * in a scope. Like useMathResults, it keeps the last value while one errors
 * or is emptied, because that is the value the graphic keeps drawing with.
 */
class OrderingStore {
  // Opacities and zOrders, keyed by MathScope id.
  private values = new Map<string, number>();

  private listeners = new Set<() => void>();

  private cached?: {
    treeOrder: Record<string, number>;
    values: ReadonlyMap<string, number>;
    order: Record<string, number>;
    zOrders: Record<string, number>;
  };

  constructor(scope: AppMathScope) {
    scope.results.forEach((value, id) => {
      if (isOrdering(id, value)) this.values.set(id, value);
    });
    const onChange: OnChangeListener<AppParseable> = (event) => {
      let next: Map<string, number> | undefined;
      event.detail.changes.results.touched.forEach((id) => {
        const value = scope.results.get(id);
        if (isOrdering(id, value) && this.values.get(id) !== value) {
          next ??= new Map(this.values);
          next.set(id, value);
        }
      });
      if (next) {
        this.values = next;
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

  /** `order`: each graphic's default zOrder. `zOrders`: its own, else that. */
  orders(treeOrder: Record<string, number>) {
    const { cached, values } = this;
    if (cached?.treeOrder === treeOrder && cached.values === values) {
      return cached;
    }
    const order = orderByOpacity(treeOrder, (itemId) =>
      values.get(mathScopeId(itemId, "opacity")),
    );
    const zOrders = Object.fromEntries(
      Object.keys(order).map((itemId) => [
        itemId,
        values.get(mathScopeId(itemId, "zOrder")) ?? order[itemId],
      ]),
    );
    this.cached = { treeOrder, values, order, zOrders };
    return this.cached;
  }
}

const stores = new WeakMap<AppMathScope, OrderingStore>();
const orderingStore = (scope: AppMathScope) => {
  let store = stores.get(scope);
  if (!store) {
    store = new OrderingStore(scope);
    stores.set(scope, store);
  }
  return store;
};

/**
 * The zOrder a graphic gets when its own zOrder is empty: by evaluated
 * opacity, then tree order. Undefined for a graphic outside the tree.
 */
const useDefaultZOrder = (itemId: string): number | undefined => {
  const store = orderingStore(useMathScope());
  const treeOrder = useSelector(select.graphicTreeOrder);
  return useSyncExternalStore(
    store.subscribe,
    () => store.orders(treeOrder).order[itemId],
  );
};

/**
 * The zOrder MathBox draws each graphic in the tree with, by item id: its
 * own where it has one, else its default.
 */
const useZOrders = (): Record<string, number> => {
  const store = orderingStore(useMathScope());
  const treeOrder = useSelector(select.graphicTreeOrder);
  return useSyncExternalStore(
    store.subscribe,
    () => store.orders(treeOrder).zOrders,
  );
};

export { useDefaultZOrder, useZOrders, orderByOpacity };
