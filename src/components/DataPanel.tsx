import React from 'react'

type RowData = Record<string, any>;

interface DataPanelProps {
    selectedColumns : string[];
    rows : RowData[];
}

export const DataPanel : React.FC<DataPanelProps> = ({
    selectedColumns,
    rows
}) => {
  return (
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
  )
}
