import * as select from "./selectors";
import type { MathItemsState } from "./mathItems.slice";
import mathItemsSlice, { actions, reducer } from "./mathItems.slice";

export { select, actions, reducer };

export type { MathItemsState };
export default mathItemsSlice;
