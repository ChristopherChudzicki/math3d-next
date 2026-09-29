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
  /**
   * Whether `key` names a scene loaded into the editor. The default scene's
   * key is `null`, as is the initial state's, so `key` alone can't say.
   */
  loaded: boolean;
  dirty: boolean;
  /**
   * Counts dirtying actions. A save records it before sending and clears
   * `dirty` only if it is unchanged when the save lands.
   */
  revision: number;
  /**
   * Counts scene loads. A save records it before sending and is ignored if
   * another scene has loaded by the time it lands.
   */
  loadCount: number;
  author: number | null;
  items: {
    [id: string]: MathItem;
  };
  /**
   * Id for the next `addNewItem`; in state so a store restored from
   * `preloadedState` doesn't reissue existing ids.
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
