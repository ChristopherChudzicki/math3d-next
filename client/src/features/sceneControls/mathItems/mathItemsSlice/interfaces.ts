import type { MathItem } from "@/configs";
import type MathScope from "@/util/MathScope";
import { Parseable } from "../FieldWidget/types";

interface MathItemsState {
  items: {
    [id: string]: MathItem;
  };
  order: Record<string, string[]>;
  activeItemId: string | undefined;
  /**
   * We need to sync the expressions in MathItem.properties with the MathScope.
   * Putting mathScope in the redux store is a very convenient way to do this
   * since actions are the centralized place for editing MathItem properties.
   *
   * This is a nonserializable value, so comes with some caveats. See
   * https://redux-toolkit.js.org/usage/usage-guide#working-with-non-serializable-data
   */
  mathScope: () => MathScope<Parseable>;
}

interface Subtree {
  id: string;
  parent: Subtree | null;
  children?: Subtree[];
}

export type { Subtree, MathItemsState };
