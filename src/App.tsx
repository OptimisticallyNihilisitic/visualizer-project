import { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import { SidePanel } from "./components/SidePanel";
import { DataPanel } from "./components/DataPanel";
import type { AggType } from "./components/DataPanel";
import { SelectorPanel } from "./components/SelectorPanel";
import { DndContext } from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { DragOverlay } from "@dnd-kit/core";

type RowData = Record<string, any>;

function App() {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [rowFields, setRowFields] = useState<string[]>([]);
  const [columnFields, setColumnFields] = useState<string[]>([]);
  const [valueFields, setValueFields] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [aggType, setAggType] = useState<AggType>("sum");

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
      if (jsonData.length === 0) { setColumns([]); setRows([]); return; }
      setColumns(Object.keys(jsonData[0]));
      setRows([...jsonData]);
      setRowFields([]); setColumnFields([]); setValueFields([]);
    };
    reader.readAsArrayBuffer(file);
    event.target.value = "";
  };

  const handleDragStart = (event: DragStartEvent) => {
    const field = event.active.data.current?.field;
    if (field) setActiveField(field);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveField(null);
    if (!over) return;
    const field = active.data.current?.field;
    if (!field) return;
    if (over.id === "rows")    setRowFields((prev) => [...new Set([...prev, field])]);
    if (over.id === "columns") setColumnFields((prev) => [...new Set([...prev, field])]);
    if (over.id === "values")  setValueFields((prev) => [...new Set([...prev, field])]);
  };

  const removeRow    = (item: string) => setRowFields((prev) => prev.filter((f) => f !== item));
  const removeColumn = (item: string) => setColumnFields((prev) => prev.filter((f) => f !== item));
  const removeValue  = (item: string) => setValueFields((prev) => prev.filter((f) => f !== item));

  const usedFields = new Set([...rowFields, ...columnFields, ...valueFields]);
  const availableColumns = columns.filter((c) => !usedFields.has(c));

  return (
    <div className="app">
      <div className="top-bar">
        <label className="custom-file-upload">
          ↑ Upload File
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            hidden
          />
        </label>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="main">
          <SidePanel columns={availableColumns} />
          <SelectorPanel
            rows={rowFields}
            columns={columnFields}
            values={valueFields}
            removeRow={removeRow}
            removeColumn={removeColumn}
            removeValue={removeValue}
            aggType={aggType}
            setAggType={setAggType}
          />
          <DataPanel
            rows={rows}
            rowFields={rowFields}
            columnFields={columnFields}
            valueFields={valueFields}
            aggType={aggType}
          />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeField ? (
            <div className="drag-overlay">{activeField}</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default App;