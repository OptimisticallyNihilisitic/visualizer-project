import { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

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
      setSelectedColumns(extractedColumns); // show all by default
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
      {/* Top Bar */}
      <div className="top-bar">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />
      </div>

      {/* Main Section */}
      <div className="main">
        {/* Left Panel */}
        <div className="sidebar">
          <h4>Columns</h4>
          {columns.map((col) => (
            <div key={col} className="column-item">
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => toggleColumn(col)}
              />
              <span>{col}</span>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="content">
          {selectedColumns.length === 0 ? (
            <p>Select columns to display data</p>
          ) : (
            <table border={1} cellPadding={6}>
              <thead>
                <tr>
                  {selectedColumns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx}>
                    {selectedColumns.map((col) => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;


/*
import { useState } from 'react';
import './App.css';
import * as XLSX from "xlsx";

function App() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event : React.ChangeEvent<HTMLInputElement>)=> {
    const files = event.target.files;
    const currFile = files == null ? null : files[0];
    setFile(currFile);

    if (!currFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const csvData = e.target?.result;
      if (!csvData) return;
      const workbook = XLSX.read(csvData, { type: "string" }); // Parse CSV
      const sheetName = workbook.SheetNames[0]; // Get first sheet
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet); // Convert to JSON
      console.log("JSON output:", jsonData);
    };
    reader.readAsText(currFile);
  };

  return (
    <>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange}/>
    </>
  )
}

export default App
*/