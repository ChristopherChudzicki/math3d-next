import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import {
  slice as mathItems,
  MathItemsState,
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

export type { RootState, SelectorReturn, AppStore, AppDispatch, AppThunk };
export { getStore, getInitialState };
