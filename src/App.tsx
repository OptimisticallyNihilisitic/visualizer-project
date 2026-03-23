import "./App.css";
import { SidePanel } from "./components/SidePanel";
import { DataPanel } from "./components/DataPanel";
import { SelectorPanel } from "./components/SelectorPanel";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useAppSelector } from "./store/hooks";
import { usePivotHandlers } from "./hooks/usePivotHandlers";

export default function App() {
  const {
    rowsRef,
    activeField,
    handleFileChange,
    handleDragStart,
    handleDragEnd,
    removeRow,
    removeColumn,
    removeValue,
    handleAggChange,
  } = usePivotHandlers();

  const pivotState = useAppSelector((s) => s.pivot);
  
  const columns = useAppSelector((s) => s.pivot.columns);

  const usedFields = new Set([
    ...pivotState.rowFields,
    ...pivotState.columnFields,
    ...pivotState.valueFields,
  ]);

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
          {activeField ? (
            <div className="drag-overlay">{activeField}</div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}