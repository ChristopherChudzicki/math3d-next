import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import mathObjects from "../features/sceneControls/mathObjects.slice";

export const store = configureStore({
  reducer: {
    mathObjects: mathObjects.reducer,
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
