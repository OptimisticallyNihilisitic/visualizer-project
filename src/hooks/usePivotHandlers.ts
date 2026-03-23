import { useState, useRef } from "react";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { dataActions, pivotActions, uiActions, cacheActions } from "../store/store";
import { getPivotCache } from "../utils/pivotUtils";
import { parseFile } from "../utils/fileUtils";

type RowData = Record<string, any>;

export function usePivotHandlers() {
  const rowsRef = useRef<RowData[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const pivotState = useAppSelector((s) => s.pivot);

  const rebuildCache = (
    rowFields: string[],
    columnFields: string[],
    valueFields: string[]
  ) => {
    const cache = getPivotCache(rowsRef.current, rowFields, columnFields, valueFields);

    if (!cache) {
      dispatch(cacheActions.clearCache());
      return;
    }

    dispatch(cacheActions.setCache(cache));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const jsonData = parseFile(data as ArrayBuffer);
      if (!jsonData.length) return;

      rowsRef.current = jsonData;

      const cols = Object.keys(jsonData[0]);

      dispatch(dataActions.setColumns({ columns: cols, }));
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
    rebuildCache(nextRowFields, nextColFields, nextValFields);
  };

  const removeRow = (item: string) => {
    dispatch(pivotActions.removeRowField(item));
    dispatch(uiActions.resetUI());

    const next = pivotState.rowFields.filter((f) => f !== item);
    rebuildCache(next, pivotState.columnFields, pivotState.valueFields);
  };

  const removeColumn = (item: string) => {
    dispatch(pivotActions.removeColumnField(item));
    dispatch(uiActions.resetUI());

    const next = pivotState.columnFields.filter((f) => f !== item);
    rebuildCache(pivotState.rowFields, next, pivotState.valueFields);
  };

  const removeValue = (item: string) => {
    dispatch(pivotActions.removeValueField(item));
    dispatch(uiActions.resetUI());

    const next = pivotState.valueFields.filter((f) => f !== item);
    rebuildCache(pivotState.rowFields, pivotState.columnFields, next);
  };

  const handleAggChange = (agg: import("../types").AggType) => {
    dispatch(pivotActions.setAggType(agg));
  };

  return {
    rowsRef,
    activeField,
    handleFileChange,
    handleDragStart,
    handleDragEnd,
    removeRow,
    removeColumn,
    removeValue,
    handleAggChange,
  };
}