import React, { useMemo } from "react";
import type { RefObject } from "react";
import "../App.css";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { uiActions } from "../store/store";
import type { AggType } from "../types";

type RowData = Record<string, any>;

// ─── Column tree (unchanged logic) ───────────────────────────────────────────
interface ColNode {
  label: string;
  path: string;
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

function flattenVisibleCols(nodes: ColNode[], expandedPaths: Set<string>): ColNode[] {
  const result: ColNode[] = [];
  function walk(node: ColNode) {
    result.push(node);
    if (node.children.length && expandedPaths.has(node.path)) {
      node.children.forEach(walk);
    }
  }
  nodes.forEach(walk);
  return result;
}

// ─── Row hierarchy ────────────────────────────────────────────────────────────
function groupRows(data: RowData[], rowFields: string[], level = 0): any[] {
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
    data: groupData,
    children: groupRows(groupData, rowFields, level + 1),
  }));
}

// ─── Formatting ───────────────────────────────────────────────────────────────
function fmt(v: number | null | undefined, aggType: AggType): string {
  if (v === null || v === undefined) return "";
  if (aggType === "count" || aggType === "countDistinct") return v.toLocaleString();
  return parseFloat(v.toFixed(2)).toLocaleString();
}

// ─── Get value from cache ─────────────────────────────────────────────────────
function getCacheVal(
  cache: any,
  rowPath: string,
  colNode: ColNode,
  valueField: string,
  aggType: AggType
): number | null {
  let total: number | null = null;
  colNode.leafKeys.forEach((colKey) => {
    const v = cache?.[rowPath]?.[colKey]?.[valueField]?.[aggType];
    if (v !== undefined && v !== null) total = (total ?? 0) + v;
  });
  return total;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface DataPanelProps {
  rowsRef: RefObject<RowData[]>;
}

export const DataPanel: React.FC<DataPanelProps> = ({ rowsRef }) => {
  const dispatch = useAppDispatch();
  const { rowFields, columnFields, valueFields, aggType } = useAppSelector((s) => s.pivot);
  const { expandedRows, expandedCols, page, rowsPerPage } = useAppSelector((s) => s.ui);
  const cache = useAppSelector((s) => s.cache);

  const valueField = valueFields[0];
  const expandedRowsSet = useMemo(() => new Set(expandedRows), [expandedRows]);
  const expandedColsSet = useMemo(() => new Set(expandedCols), [expandedCols]);

  // Build column keys from cache keys (all colKeys stored under __grand__)
  const allColumnKeys = useMemo(() => {
    if (!columnFields.length) return ["__total__"];
    const grandEntry = cache["__grand__"] ?? {};
    return Object.keys(grandEntry).filter((k) => k !== "__total__");
  }, [cache, columnFields]);

  const colTree = useMemo(() => buildColTree(allColumnKeys, columnFields), [allColumnKeys, columnFields]);
  const visibleCols = useMemo(() => flattenVisibleCols(colTree, expandedColsSet), [colTree, expandedColsSet]);

  // Build row hierarchy from actual data
  const rowHierarchy = useMemo(() => {
    if (!rowFields.length || !valueField) return [];
    return groupRows(rowsRef.current ?? [], rowFields);
  }, [rowFields, valueField, rowsRef]);

  // Flatten visible rows respecting expand state
  const visibleRows = useMemo(() => {
    const result: any[] = [];
    function traverse(nodes: any[], parentPath = "") {
      nodes.forEach((node) => {
        const path = parentPath ? `${parentPath}|||${node.key}` : node.key;
        result.push({ ...node, path });
        if (expandedRowsSet.has(path)) traverse(node.children, path);
      });
    }
    traverse(rowHierarchy);
    return result;
  }, [rowHierarchy, expandedRowsSet]);

  const totalPages = Math.max(1, Math.ceil(visibleRows.length / rowsPerPage));
  const paginatedRows = visibleRows.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const toggleRow = (path: string) => dispatch(uiActions.toggleExpandedRow(path));
  const toggleCol = (path: string) => dispatch(uiActions.toggleExpandedCol(path));

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
            <select value={rowsPerPage} onChange={(e) => dispatch(uiActions.setRowsPerPage(Number(e.target.value)))}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
          <div className="page-nav">
            <button className="page-btn" disabled={page === 1} onClick={() => dispatch(uiActions.setPage(page - 1))}>‹</button>
            <span className="page-indicator">{page} <span className="page-of">of</span> {totalPages}</span>
            <button className="page-btn" disabled={page === totalPages} onClick={() => dispatch(uiActions.setPage(page + 1))}>›</button>
          </div>
        </div>
      </div>

      <div className="innerContent">
        <table>
          <thead>
            <tr>
              <th className="row-header-cell">{rowFields.join(" › ")}</th>
              {visibleCols.map((vc, i) => {
                const hasChildren = vc.children.length > 0;
                const isExpanded = expandedColsSet.has(vc.path);
                return (
                  <th key={vc.path + i} className={`col-header-root col-depth-${Math.min(vc.depth, 4)}${isExpanded ? " col-header-expanded" : ""}`}>
                    <div className="th-inner">
                      {hasChildren && (
                        <button
                          className={`expand-col-btn${isExpanded ? " expand-col-btn--open" : ""}`}
                          onClick={() => toggleCol(vc.path)}
                        >
                          {isExpanded ? "‹" : "›"}
                        </button>
                      )}
                      <span>{vc.label}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* Grand total row */}
            <tr className="grand-total-row">
              <td className="grand-total-label">Grand Total</td>
              {visibleCols.map((vc, i) => (
                <td key={i} className="numeric-cell">
                  {fmt(getCacheVal(cache, "__grand__", vc, valueField, aggType), aggType)}
                </td>
              ))}
            </tr>

            {paginatedRows.map((node, index) => {
              const isExpandable = node.children?.length > 0;
              const isExpanded = expandedRowsSet.has(node.path);
              return (
                <tr key={node.path + index} className={`level-${node.level}`}>
                  <td className="row-label-cell" style={{ paddingLeft: 12 + node.level * 20 }}>
                    {isExpandable && (
                      <button className="expand-row-btn" onClick={() => toggleRow(node.path)}>
                        {isExpanded ? "−" : "+"}
                      </button>
                    )}
                    <span className="row-label">{node.key}</span>
                  </td>
                  {visibleCols.map((vc, i) => (
                    <td key={i} className="numeric-cell">
                      {fmt(getCacheVal(cache, node.path, vc, valueField, aggType), aggType)}
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