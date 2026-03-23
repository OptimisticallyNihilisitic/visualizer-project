import { configureStore, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AggType, PivotCache } from "../types";

interface DataState {
  columns: string[];
  columnTypes: Record<string, "numeric" | "string" | "date">;
}

//Raw data: 
const dataSlice = createSlice({
  name: "data",
  initialState: { columns: [], columnTypes: {} } as DataState,
  reducers: {
    setColumns(state, action: PayloadAction<{ columns: string[]; }>) {
      state.columns = action.payload.columns;
    },
    clearData(state) {
      state.columns = [];
    },
  },
});


interface PivotState {
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
  aggType: AggType;
}

//Pivot Table : for storing pivot table config. and handling changes 
const pivotSlice = createSlice({
  name: "pivot",
  initialState: { rowFields: [], columnFields: [], valueFields: [], aggType: "sum" } as PivotState,
  reducers: {
    addRowField(state, action: PayloadAction<string>) {
      if (!state.rowFields.includes(action.payload)) state.rowFields.push(action.payload);
    },
    addColumnField(state, action: PayloadAction<string>) {
      if (!state.columnFields.includes(action.payload)) state.columnFields.push(action.payload);
    },
    addValueField(state, action: PayloadAction<string>) {
      if (!state.valueFields.includes(action.payload)) state.valueFields.push(action.payload);
    },
    removeRowField(state, action: PayloadAction<string>) {
      state.rowFields = state.rowFields.filter((f) => f !== action.payload);
    },
    removeColumnField(state, action: PayloadAction<string>) {
      state.columnFields = state.columnFields.filter((f) => f !== action.payload);
    },
    removeValueField(state, action: PayloadAction<string>) {
      state.valueFields = state.valueFields.filter((f) => f !== action.payload);
    },
    setAggType(state, action: PayloadAction<AggType>) {
      state.aggType = action.payload;
    },
    resetPivot(state) {
      state.rowFields = [];
      state.columnFields = [];
      state.valueFields = [];
      state.aggType = "sum";
    },
  },
});


//UI: expand/colapse row or col, pagination 
interface UIState {
  expandedRows: string[];
  expandedCols: string[];
  page: number;
  rowsPerPage: number;
}
const uiSlice = createSlice({
  name: "ui",
  initialState: { expandedRows: [], expandedCols: [], page: 1, rowsPerPage: 25 } as UIState,
  reducers: {
    toggleExpandedRow(state, action: PayloadAction<string>) {
      const idx = state.expandedRows.indexOf(action.payload);
      if (idx === -1) state.expandedRows.push(action.payload);
      else state.expandedRows.splice(idx, 1);
    },
    toggleExpandedCol(state, action: PayloadAction<string>) {
      const idx = state.expandedCols.indexOf(action.payload);
      if (idx === -1) state.expandedCols.push(action.payload);
      else state.expandedCols.splice(idx, 1);
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setRowsPerPage(state, action: PayloadAction<number>) {
      state.rowsPerPage = action.payload;
      state.page = 1;
    },
    resetUI(state) {
      state.expandedRows = [];
      state.expandedCols = [];
      state.page = 1;
    },
  },
});

//Cache:
const cacheSlice = createSlice({
  name: "cache",
  initialState: {} as PivotCache,
  reducers: {
    setCache(_state, action: PayloadAction<PivotCache>) {
      return action.payload;
    },
    clearCache() {
      return {};
    },
  },
});


export const store = configureStore({
  reducer: {
    data: dataSlice.reducer,
    pivot: pivotSlice.reducer,
    ui: uiSlice.reducer,
    cache: cacheSlice.reducer,
  },
});

export const dataActions = dataSlice.actions;
export const pivotActions = pivotSlice.actions;
export const uiActions = uiSlice.actions;
export const cacheActions = cacheSlice.actions;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;