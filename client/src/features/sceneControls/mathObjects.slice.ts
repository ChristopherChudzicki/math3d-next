import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState, SelectorReturn } from "app/store";
import idGenerator from "util/idGenerator";

export interface MathItem {
  id: string;
  type: "test";
  properties: {
    description: string;
  };
}

export interface MathItemsState {
  [id: string]: MathItem;
}

const initialState: MathItemsState = Object.fromEntries(
  Array(10)
    .fill(null)
    .map((_x, i) => {
      const id = idGenerator.next();
      const properties = { description: `Object number ${i}` };
      return [id, { id, type: "test" as const, properties }];
    })
);

const mathItemsSlice = createSlice({
  name: "mathItems",
  initialState,
  // The `reducers` field lets us define reducers and generate associated actions
  reducers: {
    add: (state, action: PayloadAction<{ type: "test" }>) => {
      const { type } = action.payload;
      const id = idGenerator.next();
      const description = `Test Object: id is ${id}`;
      const mathObj = {
        id,
        type,
        properties: { description },
      };
      state[id] = mathObj;
    },
    remove: (state, action: PayloadAction<{ id: number }>) => {
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
      const { id, properties: newProperties } = action.payload;
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
