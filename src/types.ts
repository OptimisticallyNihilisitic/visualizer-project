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

export type AggBundle = Record<AggType, number | null>;

export type PivotCache = Record<string, Record<string, Record<string, AggBundle>>>;