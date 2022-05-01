import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState, SelectorReturn } from "app/store";
import { MathItem, MathItemType as MT } from "types";
import idGenerator from "util/idGenerator";

export interface MathItemsState {
  [id: string]: MathItem;
}

const initialState: MathItemsState = {};

const mathItemsSlice = createSlice({
  name: "mathItems",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    addItems: (state, action: PayloadAction<{ items: MathItem[] }>) => {
      const { items } = action.payload;
      const statePatch = Object.fromEntries(
        items.map((item) => [item.id, item])
      );
      return { ...state, ...statePatch };
    },
    addNewItem: (state) => {
      const id = idGenerator.next();
      const type = MT.Point
      const properties = {
        description: `POINT ${id}`,
        useCalculatedVisibility: false,
        color: "#3090FF",
        visible: true,
        opacity: "1",
        zIndex: "0",
        zBias: "0",
        calculatedVisibility: "",
        label: "",
        labelVisible: false,
        coords: "\\left[0,0,0\\right]",
        size: "16",
      };
      const item: MathItem = {
        id,
        type,
        properties,
      };
      state[id] = item;
    },
    remove: (state, action: PayloadAction<{ id: string }>) => {
      const { id } = action.payload;
      delete state[id];
    },
    setProperties: (
      state,
      action: PayloadAction<{
        id: string;
        properties: Partial<MathItem["properties"]>;
      }>
    ) => {
      const { id } = action.payload;
      const newProperties = action.payload.properties as any;
      const { properties: oldProperties } = state[id];
      state[id].properties = { ...oldProperties, ...newProperties };
    },
  },
});

export const selectMathItem =
  (id: string): SelectorReturn<MathItem> =>
  (state: RootState) =>
    state.mathItems[id];

export const { actions, reducer } = mathItemsSlice;
export default mathItemsSlice;
