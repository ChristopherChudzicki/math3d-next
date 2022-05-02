import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { useAppSelector } from "app/hooks";
import type { RootState, SelectorReturn } from "app/store";
import { MathItem, PatchMathItem, MathItemType as MIT } from "types";
import idGenerator from "util/idGenerator";

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
    addNewItem: (state) => {
      const id = idGenerator.next();
      const type = MIT.Point;
      const properties = {
        description: `POINT ${id}`,
        color: "#3090FF",
        visible: "true",
        opacity: "1",
        zIndex: "0",
        zBias: "0",
        label: "",
        labelVisible: "false",
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
      action: PayloadAction<PatchMathItem>
    ) => {
      const { id, type: newType, properties: newProperties } = action.payload;
      const { properties: oldProperties, type: oldType } = state[id];
      if (newType !== oldType) {
        throw new Error(`Item type should not change; ${oldType} != ${newType}`);
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
