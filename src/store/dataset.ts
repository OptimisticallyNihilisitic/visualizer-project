import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
export type RowData = Record<string, any>;

interface DatasetState {
  columns: string[];
  rows: RowData[];
  selectedColumns: string[];
}

const initialState: DatasetState = {
  columns: [],
  rows: [],
  selectedColumns: [],
};

const datasetSlice = createSlice({
  name: "dataset",
  initialState,
  reducers: {
    setDataset(
      state,
      action: PayloadAction<{ columns: string[]; rows: RowData[] }>,
    ) {
      state.columns = action.payload.columns;
      state.rows = action.payload.rows;
      state.selectedColumns = action.payload.columns; // default select all
    },

    toggleColumn(state, action: PayloadAction<string>) {
      const column = action.payload;

      if (state.selectedColumns.includes(column)) {
        state.selectedColumns = state.selectedColumns.filter(
          (col) => col !== column,
        );
      } else {
        state.selectedColumns.push(column);
      }
    },
  },
});

export const { setDataset, toggleColumn } = datasetSlice.actions;
export default datasetSlice.reducer;
