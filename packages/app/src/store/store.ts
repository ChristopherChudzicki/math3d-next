import { configureStore } from "@reduxjs/toolkit";
import type { MathItemsState } from "@/features/sceneControls/mathItems";
import { mathItemsSlice } from "@/features/sceneControls/mathItems";

type RootState = {
  mathItems: MathItemsState;
};

const getInitialState = (): RootState => ({
  mathItems: mathItemsSlice.getInitialState(),
});

type ConfigureStoreOptions = {
  preloadedState?: RootState;
};

const getStore = ({ preloadedState }: ConfigureStoreOptions = {}) =>
  configureStore({
    reducer: {
      [mathItemsSlice.name]: mathItemsSlice.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ["mathItems.mathScope"],
        },
      });
    },
  });

type AppStore = ReturnType<typeof getStore>;

type AppDispatch = AppStore["dispatch"];

type SelectorReturn<T> = (state: RootState) => T;

export type { AppDispatch, AppStore, RootState, SelectorReturn };
export { getInitialState, getStore };
