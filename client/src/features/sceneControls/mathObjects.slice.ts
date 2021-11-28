import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "app/store";
import idGenerator from "util/idGenerator";

export interface MathObject {
  id: string;
  type: "test";
  properties: {
    description: string;
  };
}

export interface MathObjectsState {
  [id: string]: MathObject;
}

const initialState: MathObjectsState = Object.fromEntries(
  Array(10)
    .fill(null)
    .map((_x, i) => {
      const id = idGenerator.next();
      const properties = { description: `Object number ${i}` };
      return [id, { id, type: "test" as const, properties }];
    })
);

const mathObjectsSlice = createSlice({
  name: "mathObjects",
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
        properties: Partial<MathObject["properties"]>;
      }>
    ) => {
      const { id, properties: newProperties } = action.payload;
      const { properties: oldProperties } = state[id];
      state[id].properties = { ...oldProperties, ...newProperties };
    },
  },
});

export const selectMathObject = (id: string) => (state: RootState) =>
  state.mathObjects[id];

export const { actions, reducer } = mathObjectsSlice;
export default mathObjectsSlice;
