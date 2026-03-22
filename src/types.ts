export type AggType =
  | "sum" | "average" | "min" | "max"
  | "count" | "countDistinct"
  | "stddev" | "variance" | "median";

export const ALL_AGG_TYPES: AggType[] = [
  "sum", "average", "min", "max",
  "count", "countDistinct", "stddev", "variance", "median",
];

export const AGG_LABELS: Record<AggType, string> = {
  sum:           "Sum",
  average:       "Average",
  min:           "Minimum",
  max:           "Maximum",
  count:         "Count",
  countDistinct: "Count (Distinct)",
  stddev:        "Std Dev",
  variance:      "Variance",
  median:        "Median",
};

// All 9 agg values precomputed for one (rowPath × colKey × valueField) cell
export type AggBundle = Record<AggType, number | null>;

// cache[rowGroupPath][colLeafKey][valueField] = AggBundle
export type PivotCache = Record<string, Record<string, Record<string, AggBundle>>>;