import { configureStore } from "@reduxjs/toolkit";
import type { SceneState } from "@/features/sceneControls/mathItems";
import { sceneSlice } from "@/features/sceneControls/mathItems";

type RootState = {
  scene: SceneState;
};

const getInitialState = (): RootState => ({
  scene: sceneSlice.getInitialState(),
});

type ConfigureStoreOptions = {
  preloadedState?: RootState;
};

const getStore = ({ preloadedState }: ConfigureStoreOptions = {}) =>
  configureStore({
    reducer: {
      [sceneSlice.name]: sceneSlice.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware({
        serializableCheck: {
          ignoredPaths: ["scene.mathScope"],
        },
      });
    },
  });

type AppStore = ReturnType<typeof getStore>;

type AppDispatch = AppStore["dispatch"];

type SelectorReturn<T> = (state: RootState) => T;

export type { AppDispatch, AppStore, RootState, SelectorReturn };
export { getInitialState, getStore };
