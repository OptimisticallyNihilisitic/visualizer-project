import React, { useMemo, useState, useEffect } from "react";
import "../App.css";

type RowData = Record<string, any>;

export type AggType =
  | "sum" | "average" | "min" | "max"
  | "count" | "countDistinct"
  | "stddev" | "variance" | "median";

interface DataPanelProps {
  rows: RowData[];
  rowFields: string[];
  columnFields: string[];
  valueFields: string[];
  aggType: AggType;
}

function groupRows(data: RowData[], rowFields: string[], columnFields: string[], valueField: string, level = 0): any[] {
  if (level >= rowFields.length) return [];
  const field = rowFields[level];
  const grouped: Record<string, RowData[]> = {};
  data.forEach((row) => {
    const key = String(row[field] ?? "Blank");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });
  return Object.entries(grouped).map(([key, groupData]) => ({
    key, 
    level,
    children: groupRows(groupData, rowFields, columnFields, valueField, level + 1),
    data: groupData,
  }));
}

function applyAgg(values: number[], aggType: AggType): number | null {
  if (!values.length) return null;
  switch (aggType) {
    case "sum":          return values.reduce((a, b) => a + b, 0);
    case "average":      return values.reduce((a, b) => a + b, 0) / values.length;
    case "min":          return Math.min(...values);
    case "max":          return Math.max(...values);
    case "count":        return values.length;
    case "countDistinct":return new Set(values).size;
    case "stddev": {
      const m = values.reduce((a, b) => a + b, 0) / values.length;
      return Math.sqrt(values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length);
    }
    case "variance": {
      const m = values.reduce((a, b) => a + b, 0) / values.length;
      return values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length;
    }
    case "median": {
      const s = [...values].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    }
    default: return null;
  }
}

function aggregate(data: RowData[], columnFields: string[], valueField: string, aggType: AggType): Record<string, number> {
  const buckets: Record<string, number[]> = {};
  data.forEach((row) => {
    const colKey = columnFields.length ? columnFields.map((f) => String(row[f] ?? "")).join("|||") : "__total__";
    const value = Number(row[valueField]);
    if (!isNaN(value)) {
      if (!buckets[colKey]) buckets[colKey] = [];
      buckets[colKey].push(value);
    }
  });
  const result: Record<string, number> = {};
  Object.entries(buckets).forEach(([k, vals]) => {
    const v = applyAgg(vals, aggType);
    if (v !== null) result[k] = v;
  });
  return result;
}

function fmt(v: number | null, aggType: AggType): string {
  if (v === null) return "";
  if (aggType === "count" || aggType === "countDistinct") return v.toLocaleString();
  return parseFloat(v.toFixed(2)).toLocaleString();
}

interface ColNode {
  label: string;
  path: string;        // "v0|||v1|||v2..."
  depth: number;
  children: ColNode[];
  leafKeys: string[];  
}

function buildColTree(columnKeys: string[], columnFields: string[]): ColNode[] {
  if (!columnFields.length) {
    return [{ label: "Total", path: "__total__", depth: 0, children: [], leafKeys: ["__total__"] }];
  }
  const roots: ColNode[] = [];

  function insert(nodes: ColNode[], parts: string[], fullKey: string, depth: number) {
    const path = parts.slice(0, depth + 1).join("|||");
    let node = nodes.find((n) => n.path === path);
    if (!node) {
      node = { label: parts[depth], path, depth, children: [], leafKeys: [] };
      nodes.push(node);
    }
    if (!node.leafKeys.includes(fullKey)) node.leafKeys.push(fullKey);
    if (depth < parts.length - 1) insert(node.children, parts, fullKey, depth + 1);
  }

  columnKeys.forEach((key) => insert(roots, key.split("|||"), key, 0));
  return roots;
}

interface VisibleCol {
  node: ColNode;
}

function flattenVisibleCols(nodes: ColNode[], expandedPaths: Set<string>): VisibleCol[] {
  const result: VisibleCol[] = [];
  function walk(node: ColNode) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path);
    result.push({ node });
    if (hasChildren && isExpanded) {
      node.children.forEach(walk); //add childcols
    }
  }
  nodes.forEach(walk);
  return result;
}

function getColVal(agg: Record<string, number>, vc: VisibleCol): number | null {
  let total: number | null = null;
  vc.node.leafKeys.forEach((k) => {
    if (agg[k] !== undefined) total = (total ?? 0) + agg[k];
  });
  return total;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  rows, rowFields, columnFields, valueFields, aggType,
}) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedCols, setExpandedCols] = useState<Set<string>>(new Set());

  const valueField = valueFields[0];

  const rowHierarchy = useMemo(() => {
    if (!rowFields.length || !valueField) return [];
    return groupRows(rows, rowFields, columnFields, valueField);
  }, [rows, rowFields, columnFields, valueField]);

  const allColumnKeys = useMemo(() => {
    if (!columnFields.length) return ["__total__"];
    return Array.from(new Set(
      rows.map((r) => columnFields.map((f) => String(r[f] ?? "")).join("|||"))
    ));
  }, [rows, columnFields]);

  const colTree = useMemo(
    () => buildColTree(allColumnKeys, columnFields),
    [allColumnKeys, columnFields]
  );

  const visibleCols = useMemo(
    () => flattenVisibleCols(colTree, expandedCols),
    [colTree, expandedCols]
  );

  const grandTotalAgg = useMemo(() => {
    if (!valueField) return {};
    return aggregate(rows, columnFields, valueField, aggType);
  }, [rows, columnFields, valueField, aggType]);

  const visibleRows = useMemo(() => {
    const result: any[] = [];
    function traverse(nodes: any[], parentPath = "") {
      nodes.forEach((node) => {
        const path = parentPath ? `${parentPath}|||${node.key}` : node.key;
        result.push({ ...node, path });
        if (expandedRows.has(path)) traverse(node.children, path);
      });
    }
    traverse(rowHierarchy);
    return result;
  }, [rowHierarchy, expandedRows]);

  useEffect(() => {
    setPage(1);
    setExpandedRows(new Set());
    setExpandedCols(new Set());
  }, [rowFields, columnFields, valueFields, rows, aggType]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / rowsPerPage));
  const paginatedRows = visibleRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleRowExpand = (path: string) =>
    setExpandedRows((prev) => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });

  const toggleColExpand = (path: string) =>
    setExpandedCols((prev) => { const n = new Set(prev); n.has(path) ? n.delete(path) : n.add(path); return n; });

  if (!rowFields.length || !valueFields.length) {
    return (
      <div className="content">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <p>Drag fields into <strong>Rows</strong> and <strong>Values</strong> to build your pivot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <div className="paginationBar">
        <div className="pagination-info">{visibleRows.length} rows</div>
        <div className="pagination-controls">
          <label className="rows-per-page-label">
            Rows per page
            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <div className="page-nav">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
            <span className="page-indicator">{page} <span className="page-of">of</span> {totalPages}</span>
            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>›</button>
          </div>
        </div>
      </div>

      <div className="innerContent">
        <table>
          <thead>
            <tr>
              <th className="row-header-cell">{rowFields.join(" › ")}</th>
              {visibleCols.map((vc, i) => {
                const hasChildren = vc.node.children.length > 0;
                const isExpanded = expandedCols.has(vc.node.path);
                const depthClass = `col-depth-${Math.min(vc.node.depth, 4)}`;
                return (
                  <th key={vc.node.path + i} className={`col-header-root ${depthClass}${isExpanded ? " col-header-expanded" : ""}`}>
                    <div className="th-inner">
                      {hasChildren && (
                        <button
                          className={`expand-col-btn${isExpanded ? " expand-col-btn--open" : ""}`}
                          onClick={() => toggleColExpand(vc.node.path)}
                          title={isExpanded ? "Collapse" : "Expand sub-columns"}
                        >
                          {isExpanded ? "‹" : "›"}
                        </button>
                      )}
                      <span>{vc.node.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            <tr className="grand-total-row">
              <td className="grand-total-label">Grand Total</td>
              {visibleCols.map((vc, i) => (
                <td key={i} className="numeric-cell">
                  {fmt(getColVal(grandTotalAgg, vc), aggType)}
                </td>
              ))}
            </tr>

            {paginatedRows.map((node, index) => {
              const agg = aggregate(node.data, columnFields, valueField, aggType);
              const isExpandable = node.children?.length > 0;
              const isExpanded = expandedRows.has(node.path);
              return (
                <tr key={node.path + index} className={`level-${node.level}`}>
                  <td className="row-label-cell" style={{ paddingLeft: 12 + node.level * 20 }}>
                    {isExpandable && (
                      <button className="expand-row-btn" onClick={() => toggleRowExpand(node.path)}>
                        {isExpanded ? "−" : "+"}
                      </button>
                    )}
                    <span className="row-label">{node.key}</span>
                  </td>
                  {visibleCols.map((vc, i) => (
                    <td key={i} className="numeric-cell">
                      {fmt(getColVal(agg, vc), aggType)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};