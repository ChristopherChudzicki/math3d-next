import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import type {
  MathItemsState,
  ItemOrderState,
} from "features/sceneControls/mathItems";
import {
  mathItemsSlice,
  itemOrderSlice,
} from "features/sceneControls/mathItems";

type RootState = {
  mathItems: MathItemsState;
  itemOrder: ItemOrderState;
};

const getInitialState = (): RootState => ({
  mathItems: mathItemsSlice.getInitialState(),
  itemOrder: itemOrderSlice.getInitialState(),
});

type ConfigureStoreOptions = {
  preloadedState?: RootState;
};

const getStore = ({ preloadedState }: ConfigureStoreOptions = {}) =>
  configureStore({
    reducer: {
      [mathItemsSlice.name]: mathItemsSlice.reducer,
      [itemOrderSlice.name]: itemOrderSlice.reducer,
    },
    preloadedState,
  });

type AppStore = ReturnType<typeof getStore>;

type AppDispatch = AppStore["dispatch"];
type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

type SelectorReturn<T> = (state: RootState) => T;

export type { AppDispatch, AppStore, AppThunk, RootState, SelectorReturn };
export { getInitialState, getStore };
