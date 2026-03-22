import type { AggType, AggBundle, PivotCache } from "../types";
import { ALL_AGG_TYPES } from "../types";

type RowData = Record<string, any>;

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

function makeBundle(values: number[]): AggBundle {
  const bundle = {} as AggBundle;
  ALL_AGG_TYPES.forEach((agg) => {
    bundle[agg] = applyAgg(values, agg);
  });
  return bundle;
}

// Recursively builds cache entries for every row group path
function buildGroupCache(
  data: RowData[],
  rowFields: string[],
  columnFields: string[],
  valueFields: string[],
  cache: PivotCache,
  level: number,
  parentPath: string
) {
  if (level >= rowFields.length) return;

  const field = rowFields[level];
  const grouped: Record<string, RowData[]> = {};
  data.forEach((row) => {
    const key = String(row[field] ?? "Blank");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  Object.entries(grouped).forEach(([key, groupData]) => {
    const path = parentPath ? `${parentPath}|||${key}` : key;

    // For each valueField × colKey, compute bundle
    valueFields.forEach((valueField) => {
      // Build col buckets: colKey -> number[]
      const colBuckets: Record<string, number[]> = {};

      groupData.forEach((row) => {
        const colKey = columnFields.length
          ? columnFields.map((f) => String(row[f] ?? "")).join("|||")
          : "__total__";
        const val = Number(row[valueField]);
        if (!isNaN(val)) {
          if (!colBuckets[colKey]) colBuckets[colKey] = [];
          colBuckets[colKey].push(val);
        }
      });

      // Also compute __total__ across all cols
      const allVals = groupData
        .map((r) => Number(r[valueField]))
        .filter((v) => !isNaN(v));
      colBuckets["__total__"] = allVals;

      Object.entries(colBuckets).forEach(([colKey, vals]) => {
        if (!cache[path]) cache[path] = {};
        if (!cache[path][colKey]) cache[path][colKey] = {};
        cache[path][colKey][valueField] = makeBundle(vals);
      });
    });

    // Recurse into children
    buildGroupCache(groupData, rowFields, columnFields, valueFields, cache, level + 1, path);
  });
}

export function buildPivotCache(
  rows: RowData[],
  rowFields: string[],
  columnFields: string[],
  valueFields: string[]
): PivotCache {
  if (!rowFields.length || !valueFields.length) return {};

  const cache: PivotCache = {};

  // Grand total row (path = "__grand__")
  valueFields.forEach((valueField) => {
    const colBuckets: Record<string, number[]> = {};
    rows.forEach((row) => {
      const colKey = columnFields.length
        ? columnFields.map((f) => String(row[f] ?? "")).join("|||")
        : "__total__";
      const val = Number(row[valueField]);
      if (!isNaN(val)) {
        if (!colBuckets[colKey]) colBuckets[colKey] = [];
        colBuckets[colKey].push(val);
      }
    });
    const allVals = rows.map((r) => Number(r[valueField])).filter((v) => !isNaN(v));
    colBuckets["__total__"] = allVals;

    Object.entries(colBuckets).forEach(([colKey, vals]) => {
      if (!cache["__grand__"]) cache["__grand__"] = {};
      if (!cache["__grand__"][colKey]) cache["__grand__"][colKey] = {};
      cache["__grand__"][colKey][valueField] = makeBundle(vals);
    });
  });

  buildGroupCache(rows, rowFields, columnFields, valueFields, cache, 0, "");
  return cache;
}