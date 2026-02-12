import React from "react";

type RowData = Record<string, any>;

interface DataPanelProps {
  rows: RowData[];
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
}

function generatePivot(
  data: RowData[],
  rowFields: string[],
  columnFields: string[],
  valueField: string,
) {
  const pivot: Record<string, Record<string, number>> = {};

  data.forEach((row) => {
    const rowKey = rowFields.map((f) => row[f]).join(" | ");
    const colKey = columnFields.map((f) => row[f]).join(" | ");

    const value = Number(row[valueField]) || 0;

    if (!pivot[rowKey]) {
      pivot[rowKey] = {};
    }

    if (!pivot[rowKey][colKey]) {
      pivot[rowKey][colKey] = 0;
    }

    pivot[rowKey][colKey] += value;
  });

  return pivot;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  rows,
  rowFields,
  columnFields,
  valueFields,
}) => {
  if (!rowFields.length || !columnFields.length || !valueFields.length) {
    return (
      <div className="content">Drag fields into Rows, Columns and Values</div>
    );
  } 

  const valueField = valueFields[0]; // single value for now

  const pivot = generatePivot(rows, rowFields, columnFields, valueField);

  const rowKeys = Object.keys(pivot);

  const columnKeys = Array.from(
    new Set(rows.map((r) => columnFields.map((f) => r[f]).join(" | "))),
  );

  return (
    <div className="content">
      <div className="innerContent">
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>{rowFields.join(" | ")}</th>
              {columnKeys.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowKeys.map((rowKey) => (
              <tr key={rowKey}>
                <td>{rowKey}</td>
                {columnKeys.map((colKey) => (
                  <td key={colKey}>{pivot[rowKey][colKey] ?? 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
