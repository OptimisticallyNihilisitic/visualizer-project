import { buildPivotCache } from "../store/buildCache";
import type { AggType } from "../types";

type RowData = Record<string, any>;

export function getPivotCache(
  rows: RowData[],
  rowFields: string[],
  columnFields: string[],
  valueFields: string[]
) {
  if (!rowFields.length || !valueFields.length) return null;
  return buildPivotCache(rows, rowFields, columnFields, valueFields);
}

//Column handling: [used for DataPanel]
export interface ColNode {
  label: string;
  path: string;
  depth: number;
  children: ColNode[];
  leafKeys: string[];
}

export function buildColTree(columnKeys: string[], columnFields: string[]): ColNode[] {
  if (!columnFields.length) {
    return [
      {
        label: "Total",
        path: "__total__",
        depth: 0,
        children: [],
        leafKeys: ["__total__"],
      },
    ];
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

    if (depth < parts.length - 1) {
      insert(node.children, parts, fullKey, depth + 1);
    }
  }

  columnKeys.forEach((key) => insert(roots, key.split("|||"), key, 0));
  return roots;
}

export function flattenVisibleCols(nodes: ColNode[], expandedPaths: Set<string>): ColNode[] {
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

//Row handling: [Used in DataPanel]
export function groupRows(data: RowData[], rowFields: string[], level = 0): any[] {
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

//Cache
export function getCacheVal(
  cache: any,
  rowPath: string,
  colNode: ColNode,
  valueField: string,
  aggType: AggType
): number | null {
  let total: number | null = null;

  colNode.leafKeys.forEach((colKey) => {
    const v = cache?.[rowPath]?.[colKey]?.[valueField]?.[aggType];
    if (v !== undefined && v !== null) {
      total = (total ?? 0) + v;
    }
  });

  return total;
}