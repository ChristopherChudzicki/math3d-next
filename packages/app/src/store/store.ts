import { configureStore } from "@reduxjs/toolkit";
import type { SceneState } from "@/features/sceneControls/mathItems";
import { sceneSlice } from "@/features/sceneControls/mathItems";
import { createMathScopeSync } from "@/features/sceneControls/mathItems/sceneSlice/mathScopeSync";

type RootState = {
  scene: SceneState;
};

const getInitialState = (): RootState => ({
  scene: sceneSlice.getInitialState(),
});

type ConfigureStoreOptions = {
  preloadedState?: RootState;
};

const getStore = ({ preloadedState }: ConfigureStoreOptions = {}) => {
  const mathScopeSync = createMathScopeSync();
  const store = configureStore({
    reducer: {
      [sceneSlice.name]: sceneSlice.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(mathScopeSync.middleware),
  });
  return Object.assign(store, { mathScope: mathScopeSync.source });
};

type AppStore = ReturnType<typeof getStore>;

type AppDispatch = AppStore["dispatch"];

type SelectorReturn<T> = (state: RootState) => T;

export type { AppDispatch, AppStore, RootState, SelectorReturn };
export { getInitialState, getStore };
