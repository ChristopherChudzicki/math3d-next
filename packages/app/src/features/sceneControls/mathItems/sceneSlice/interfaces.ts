import type { MathItem } from "@math3d/mathitem-configs";
import type MathScope from "@math3d/mathscope";
import { ValidatedParseable } from "@math3d/parser";

// The app parses validator-bearing parseables: syncMathScope attaches each math
// property's config validator to the stored (validate-free) parseable before
// handing it to MathScope. The stored item shape stays validate-free.
type AppParseable = ValidatedParseable;
type AppMathScope = MathScope<AppParseable>;

interface SceneState {
  key: string | null;
  dirty: boolean;
  author: number | null;
  items: {
    [id: string]: MathItem;
  };
  /**
   * Id for the next item created by `addNewItem`. Kept in state rather than a
   * module-level counter so a store restored from `preloadedState` is
   * self-contained.
   */
  nextItemId: number;
  order: Record<string, string[]>;
  activeItemId: string | undefined;
  activeTabId: string;
  title: string;
  isLegacy: boolean;
}

interface Subtree {
  id: string;
  parent: Subtree | null;
  children?: Subtree[];
}

export type { Subtree, SceneState, AppMathScope, AppParseable };
