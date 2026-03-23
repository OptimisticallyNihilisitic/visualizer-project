import { useRef } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import { SidePanel } from "./components/SidePanel";
import { DataPanel } from "./components/DataPanel";
import { SelectorPanel } from "./components/SelectorPanel";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { dataActions, pivotActions, uiActions, cacheActions } from "./store/store";
import { buildPivotCache } from "./store/buildCache";

type RowData = Record<string, any>;

function inferType(values: any[]): "numeric" | "date" | "string" {
  const sample = values.filter((v) => v !== null && v !== undefined && v !== "").slice(0, 50);
  const numericCount = sample.filter((v) => !isNaN(Number(v))).length;
  if (numericCount / sample.length > 0.8) return "numeric";
  const dateCount = sample.filter((v) => !isNaN(Date.parse(String(v)))).length;
  if (dateCount / sample.length > 0.8) return "date";
  return "string";
}

export default function App() {
  const rowsRef = useRef<RowData[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const pivotState = useAppSelector((s) => s.pivot); //rowField, colField, valueField, aggType
  const columns = useAppSelector((s) => s.data.columns);
  const usedFields = new Set([...pivotState.rowFields, ...pivotState.columnFields, ...pivotState.valueFields]);
  const availableColumns = columns.filter((c) => !usedFields.has(c));

  //When ever the rows, rowField, columnField, valueField change, I am rebuiding the cache
  const rebuildCache = (
    rows: RowData[],
    rowFields: string[],
    columnFields: string[],
    valueFields: string[]
  ) => {
    if (!rowFields.length || !valueFields.length) {
      dispatch(cacheActions.clearCache());
      return;
    }
    const cache = buildPivotCache(rows, rowFields, columnFields, valueFields);
    dispatch(cacheActions.setCache(cache));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<RowData>(worksheet);
      if (!jsonData.length) return;

      rowsRef.current = jsonData;

      const cols = Object.keys(jsonData[0]);
      const columnTypes: Record<string, "numeric" | "string" | "date"> = {};
      cols.forEach((col) => {
        columnTypes[col] = inferType(jsonData.map((r) => r[col]));
      });

      dispatch(dataActions.setColumns({ columns: cols, columnTypes }));
      dispatch(pivotActions.resetPivot());
      dispatch(uiActions.resetUI());
      dispatch(cacheActions.clearCache());
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveField(event.active.data.current?.field ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveField(null);
    if (!over) return;
    const field = active.data.current?.field as string;
    if (!field) return;

    let nextRowFields = pivotState.rowFields;
    let nextColFields = pivotState.columnFields;
    let nextValFields = pivotState.valueFields;

    if (over.id === "rows") {
      dispatch(pivotActions.addRowField(field));
      nextRowFields = [...new Set([...pivotState.rowFields, field])];
    }
    if (over.id === "columns") {
      dispatch(pivotActions.addColumnField(field));
      nextColFields = [...new Set([...pivotState.columnFields, field])];
    }
    if (over.id === "values") {
      dispatch(pivotActions.addValueField(field));
      nextValFields = [...new Set([...pivotState.valueFields, field])];
    }

    dispatch(uiActions.resetUI());
    rebuildCache(rowsRef.current, nextRowFields, nextColFields, nextValFields);
  };

  const removeRow = (item: string) => {
    dispatch(pivotActions.removeRowField(item));
    dispatch(uiActions.resetUI());
    const next = pivotState.rowFields.filter((f) => f !== item);
    rebuildCache(rowsRef.current, next, pivotState.columnFields, pivotState.valueFields);
  };

  const removeColumn = (item: string) => {
    dispatch(pivotActions.removeColumnField(item));
    dispatch(uiActions.resetUI());
    const next = pivotState.columnFields.filter((f) => f !== item);
    rebuildCache(rowsRef.current, pivotState.rowFields, next, pivotState.valueFields);
  };

  const removeValue = (item: string) => {
    dispatch(pivotActions.removeValueField(item));
    dispatch(uiActions.resetUI());
    const next = pivotState.valueFields.filter((f) => f !== item);
    rebuildCache(rowsRef.current, pivotState.rowFields, pivotState.columnFields, next);
  };

  const handleAggChange = (agg: import("./types").AggType) => {
    dispatch(pivotActions.setAggType(agg));
  };

  return (
    <div className="app">
      <div className="top-bar">
        <label className="custom-file-upload">
          ↑ Upload File
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} hidden />
        </label>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="main">
          <SidePanel columns={availableColumns} />
          <SelectorPanel
            rows={pivotState.rowFields}
            columns={pivotState.columnFields}
            values={pivotState.valueFields}
            removeRow={removeRow}
            removeColumn={removeColumn}
            removeValue={removeValue}
            aggType={pivotState.aggType}
            setAggType={handleAggChange}
          />
          <DataPanel rowsRef={rowsRef} />
        </div>
        <DragOverlay dropAnimation={null}>
          {activeField ? <div className="drag-overlay">{activeField}</div> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}