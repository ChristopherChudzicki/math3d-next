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
  order: Record<string, string[]>;
  activeItemId: string | undefined;
  activeTabId: string;
  title: string;
  isLegacy: boolean;
  /**
   * We need to sync the expressions in MathItem.properties with the MathScope.
   * Putting mathScope in the redux store is a very convenient way to do this
   * since actions are the centralized place for editing MathItem properties.
   *
   * This is a nonserializable value, so comes with some caveats. See
   * https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
   */
  mathScope: () => AppMathScope;
}

interface Subtree {
  id: string;
  parent: Subtree | null;
  children?: Subtree[];
}

export type { Subtree, SceneState, AppMathScope, AppParseable };
