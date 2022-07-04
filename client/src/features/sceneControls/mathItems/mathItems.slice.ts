import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  MathItem,
  mathItemConfigs,
  MathItemPatch,
  MathItemType,
} from "configs";
import { keyBy } from "lodash";
import { useAppSelector } from "store/hooks";
import type { RootState, SelectorReturn } from "store/store";

import defaultScene from "../defaultScene";

export interface MathItemsState {
  [id: string]: MathItem;
}

const getInitialState = (): MathItemsState =>
  keyBy(defaultScene.items, (item) => item.id);

const mathItemsSlice = createSlice({
  name: "mathItems",
  initialState: getInitialState,
  reducers: {
    addItems: (state, action: PayloadAction<{ items: MathItem[] }>) => {
      const { items } = action.payload;
      const statePatch = Object.fromEntries(
        items.map((item) => [item.id, item])
      );
      return { ...state, ...statePatch };
    },
    addNewItem: (
      state,
      action: PayloadAction<{ type: MathItemType; id: string }>
    ) => {
      const { type, id } = action.payload;
      const item = mathItemConfigs[type].make(id);
      state[id] = item;
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      delete state[id];
    },
    setProperties: (
      state,
      action: PayloadAction<MathItemPatch<MathItemType>>
    ) => {
      const { id, properties: newProperties } = action.payload;
      const { properties: oldProperties } = state[id];
      state[id].properties = { ...oldProperties, ...newProperties };
    },
  },
});

export const selectMathItems =
  (): SelectorReturn<MathItemsState> => (state: RootState) =>
    state.mathItems;

export const selectMathItem =
  (id: string): SelectorReturn<MathItem> =>
  (state: RootState) =>
    state.mathItems[id];

export const useMathItem = (id: string) => {
  const mathItem = useAppSelector(selectMathItem(id));
  return mathItem;
};

export const { actions, reducer } = mathItemsSlice;
export default mathItemsSlice;
