import type { AggType } from "../types";

export const AGG_OPTIONS: { value: AggType; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "average", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "countDistinct", label: "Count (Distinct)" },
  { value: "count", label: "Count" },
  { value: "stddev", label: "Standard deviation" },
  { value: "variance", label: "Variance" },
  { value: "median", label: "Median" },
];