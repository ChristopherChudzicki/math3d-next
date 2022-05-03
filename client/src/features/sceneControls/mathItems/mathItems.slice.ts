import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppSelector } from "app/hooks";
import type { RootState, SelectorReturn } from "app/store";
import { MathItem, PatchMathItem } from "types";
import idGenerator from "util/idGenerator";
import { make, AddableTypes } from "./configs";

export interface MathItemsState {
  [id: string]: MathItem;
}

const initialState: MathItemsState = {};

const mathItemsSlice = createSlice({
  name: "mathItems",
  initialState,
  reducers: {
    addItems: (state, action: PayloadAction<{ items: MathItem[] }>) => {
      const { items } = action.payload;
      const statePatch = Object.fromEntries(
        items.map((item) => [item.id, item])
      );
      return { ...state, ...statePatch };
    },
    addNewItem: (state, action: PayloadAction<{ type: AddableTypes }>) => {
      const { type } = action.payload;
      const id = idGenerator.next();
      const item = make(id, type);
      state[id] = item;
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      delete state[id];
    },
    setProperties: (state, action: PayloadAction<PatchMathItem>) => {
      const { id, type: newType, properties: newProperties } = action.payload;
      const { properties: oldProperties, type: oldType } = state[id];
      if (newType !== oldType) {
        throw new Error(
          `Item type should not change; ${oldType} != ${newType}`
        );
      }
      state[id].properties = { ...oldProperties, ...newProperties };
    },
  },
});

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
