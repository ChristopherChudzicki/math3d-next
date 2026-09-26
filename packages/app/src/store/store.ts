import { combineReducers, configureStore } from "@reduxjs/toolkit";
import type { UnknownAction } from "@reduxjs/toolkit";
import type { SceneState } from "@/features/sceneControls/mathItems";
import {
  sceneSlice,
  createMathScopeSync,
} from "@/features/sceneControls/mathItems";
import { restoreStore } from "./restoreStore";

type RootState = {
  scene: SceneState;
};

const getInitialState = (): RootState => ({
  scene: sceneSlice.getInitialState(),
});

const combinedReducer = combineReducers({
  [sceneSlice.name]: sceneSlice.reducer,
});

const rootReducer = (state: RootState | undefined, action: UnknownAction) =>
  restoreStore.match(action) ? action.payload : combinedReducer(state, action);

type ConfigureStoreOptions = {
  preloadedState?: RootState;
};

const getStore = ({ preloadedState }: ConfigureStoreOptions = {}) => {
  const mathScopeSync = createMathScopeSync();
  const store = configureStore({
    reducer: rootReducer,
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
