// Shared types used across store, DataPanel, SelectorPanel

export type AggType =
  | "sum" | "average" | "min" | "max"
  | "count" | "countDistinct"
  | "stddev" | "variance" | "median";


export const ALL_AGG_TYPES: AggType[] = [
  "sum", "average", "min", "max",
  "count", "countDistinct", "stddev", "variance", "median",
];

export const AGG_LABELS: Record<AggType, string> = {
  sum:          "Sum",
  average:      "Average",
  min:          "Minimum",
  max:          "Maximum",
  count:        "Count",
  countDistinct:"Count (Distinct)",
  stddev:       "Std Dev",
  variance:     "Variance",
  median:       "Median",
};

// One cell in the cache: all 9 agg values for a (rowPath × colKey × valueField) triple
// Stored as a fixed-length tuple indexed by ALL_AGG_TYPES order for O(1) lookup
export type AggBundle = Record<AggType, number | null>;

// The full cache for one pivot configuration:
// cache[rowGroupPath][colLeafKey][valueField] = AggBundle
export type PivotCache = Record<string, Record<string, Record<string, AggBundle>>>;