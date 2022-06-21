import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import {
  MathItemsState,
  slice as mathItems,
} from "features/sceneControls/mathItems";

type RootState = {
  mathItems: MathItemsState;
};

const getInitialState = (): RootState => ({
  mathItems: mathItems.getInitialState(),
});

type ConfigureStoreOptions = {
  preloadedState?: RootState;
};

const getStore = ({ preloadedState }: ConfigureStoreOptions = {}) =>
  configureStore({
    reducer: {
      mathItems: mathItems.reducer,
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
