import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import mathItems from "../features/sceneControls/mathItems.slice";

export const store = configureStore({
  reducer: {
    mathItems: mathItems.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

export type SelectorReturn<T> = (state: RootState) => T;
