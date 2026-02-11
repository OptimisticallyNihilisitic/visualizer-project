import { configureStore } from "@reduxjs/toolkit";
import datasetReducer from "./dataset";

export const store = configureStore({
  reducer: {
    dataset: datasetReducer,
  },
});

// Types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
