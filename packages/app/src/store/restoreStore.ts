import { createAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

/** Replaces the whole store, e.g. with a draft saved across a sign-in redirect. */
const restoreStore = createAction<RootState>("store/restore");

export { restoreStore };
