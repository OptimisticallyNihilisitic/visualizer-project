import React, { useMemo, useState, useEffect } from "react";
import "../App.css";

type RowData = Record<string, any>;

interface DataPanelProps {
  rows: RowData[];
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
}

function groupRows(
  data: RowData[],
  rowFields: string[],
  columnFields: string[],
  valueField: string,
  level = 0
): any[] {
  if (level >= rowFields.length) return [];

  const field = rowFields[level];
  const grouped: Record<string, RowData[]> = {};

  data.forEach((row) => {
    const key = row[field] ?? "Blank";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  return Object.entries(grouped).map(([key, groupData]) => {
    const children = groupRows(
      groupData,
      rowFields,
      columnFields,
      valueField,
      level + 1
    );

    return {
      key,
      level,
      children,
      data: groupData,
    };
  });
}

function aggregate(
  data: RowData[],
  columnFields: string[],
  valueField: string
) {
  const result: Record<string, number> = {};

  data.forEach((row) => {
    const colKey =
      columnFields.map((f) => row[f]).join(" | ") || "Total";

    const rawValue = row[valueField];

    if (rawValue === null || rawValue === undefined || rawValue === "")
      return;

    const value = Number(rawValue);
    if (isNaN(value)) return;

    if (!result[colKey]) result[colKey] = 0;
    result[colKey] += value;
  });

  return result;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  rows,
  rowFields,
  columnFields,
  valueFields,
}) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const valueField = valueFields[0];

  const rowHierarchy = useMemo(() => {
    if (!rowFields.length || !valueField) return [];
    return groupRows(rows, rowFields, columnFields, valueField);
  }, [rows, rowFields, columnFields, valueField]);

  const columnKeys = useMemo(() => {
    if (!columnFields.length) return ["Total"];
    return Array.from(
      new Set(
        rows.map((r) =>
          columnFields.map((f) => r[f]).join(" | ") || "Total"
        )
      )
    );
  }, [rows, columnFields]);

  const visibleRows = useMemo(() => {
    const result: any[] = [];

    function traverse(nodes: any[], parentPath = "") {
      nodes.forEach((node) => {
        const path = parentPath
          ? `${parentPath}|${node.key}`
          : node.key;

        result.push({ ...node, path });

        if (expanded.has(path)) {
          traverse(node.children, path);
        }
      });
    }

    traverse(rowHierarchy);
    return result;
  }, [rowHierarchy, expanded]);

  useEffect(() => {
    setPage(1);
    setExpanded(new Set());
  }, [rowFields, columnFields, valueFields, rows]);

  const totalPages = Math.max(
    1,
    Math.ceil(visibleRows.length / rowsPerPage)
  );

  const paginatedRows = visibleRows.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const toggleExpand = (path: string) => {
    setExpanded((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  if (!rowFields.length || !valueFields.length) {
    return (
      <div className="content">
        Drag fields into Rows and Values
      </div>
    );
  }

  return (
    <div className="content">
      <div className="innerContent">
        <table border={1} cellPadding={6}>
          <thead>
            <tr>
              <th>{rowFields.join(" > ")}</th>
              {columnKeys.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((node, index) => {
              const agg = aggregate(
                node.data,
                columnFields,
                valueField
              );

              const isExpandable =
                node.children && node.children.length > 0;

              const isExpanded = expanded.has(node.path);

              return (
                <tr key={node.path + index}>
                  <td
                    style={{
                      paddingLeft: 16 + node.level * 18,
                      fontWeight: "normal",
                      cursor: isExpandable
                        ? "pointer"
                        : "default",
                    }}
                  >
                    {isExpandable && (
                      <span
                        onClick={() =>
                          toggleExpand(node.path)
                        }
                        style={{ marginRight: 6 }}
                      >
                        <button>
                          {isExpanded ? "-" : "+"}
                        </button>
                      </span>
                    )}
                    {node.key}
                  </td>

                  {columnKeys.map((col) => (
                    <td key={col}>
                      {agg[col] !== undefined ? agg[col] : ""}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div style={{ marginTop: 15, display: "flex", alignItems: "center", gap: 15 }}>
          <div>
            Rows per page:{" "}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
