import React from 'react'

interface SidePanelProps {
    columns : string[];
    selectedColumns : string[];
    toggleColumn: (col: string) => void;
}

export const SidePanel : React.FC<SidePanelProps> = ({
    columns,
    selectedColumns,
    toggleColumn
}) => {
  return (
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
  )
}
