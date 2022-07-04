import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import type {
  MathItemsState,
  SortableTreeState,
} from "features/sceneControls/mathItems";
import {
  mathItemsSlice,
  sortableTreeSlice,
} from "features/sceneControls/mathItems";

type RootState = {
  mathItems: MathItemsState;
  sortableTree: SortableTreeState;
};

const getInitialState = (): RootState => ({
  mathItems: mathItemsSlice.getInitialState(),
  sortableTree: sortableTreeSlice.getInitialState(),
});

type ConfigureStoreOptions = {
  preloadedState?: RootState;
};

const getStore = ({ preloadedState }: ConfigureStoreOptions = {}) =>
  configureStore({
    reducer: {
      [mathItemsSlice.name]: mathItemsSlice.reducer,
      [sortableTreeSlice.name]: sortableTreeSlice.reducer,
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
