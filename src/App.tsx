import { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";
import { SidePanel } from "./components/SidePanel";
import { DataPanel } from "./components/DataPanel";

type RowData = Record<string, any>;

function App() {
  const [columns, setColumns] = useState<string[]>([]);
  const [rows, setRows] = useState<RowData[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;

      const workbook = XLSX.read(data, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json<RowData>(worksheet);

      if (jsonData.length === 0) return;

      const extractedColumns = Object.keys(jsonData[0]);

      setColumns(extractedColumns);
      setRows(jsonData);
      //setSelectedColumns(extractedColumns);
    };

    reader.readAsText(file);
  };

  const toggleColumn = (column: string) => {
    setSelectedColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  return (
    <div className="app">
      <div className="top-bar">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
      </div>

      <div className="main">
        <SidePanel 
          columns = {columns}
          selectedColumns={selectedColumns}
          toggleColumn={toggleColumn}
        />
        <DataPanel 
          selectedColumns={selectedColumns}
          rows={rows}
        />
      </div>
    </div>
  );
}

export default App;

