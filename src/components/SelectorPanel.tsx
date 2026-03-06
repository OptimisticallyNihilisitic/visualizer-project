import { useDroppable } from "@dnd-kit/core";
import type { AggType } from "./DataPanel";

const AGG_OPTIONS: { value: AggType; label: string }[] = [
  { value: "sum",           label: "Sum" },
  { value: "average",       label: "Average" },
  { value: "min",           label: "Minimum" },
  { value: "max",           label: "Maximum" },
  { value: "countDistinct", label: "Count (Distinct)" },
  { value: "count",         label: "Count" },
  { value: "stddev",        label: "Standard deviation" },
  { value: "variance",      label: "Variance" },
  { value: "median",        label: "Median" },
];

function DropBucket({
  id, title, icon, items, onRemove,
}: {
  id: string; title: string; icon: string;
  items: string[]; onRemove: (item: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`drop-bucket${isOver ? " drop-bucket--over" : ""}`}>
      <div className="drop-bucket-header">
        <span className="drop-bucket-icon">{icon}</span>
        <strong className="drop-bucket-title">{title}</strong>
        
      </div>
      <div className="drop-bucket-items">
        {items.length === 0 && (
          <div className="drop-bucket-empty">Drop field here</div>
        )}
        {items.map((item) => (
          <div key={item} className="selector-chip">
            <span className="selector-chip-label" title={item}>{item}</span>
            <button className="selector-chip-remove" onClick={() => onRemove(item)}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export const SelectorPanel = ({
  rows, columns, values,
  removeRow, removeColumn, removeValue,
  aggType, setAggType,
}: {
  rows: string[]; columns: string[]; values: string[];
  removeRow: (i: string) => void;
  removeColumn: (i: string) => void;
  removeValue: (i: string) => void;
  aggType: AggType;
  setAggType: (t: AggType) => void;
}) => (
  <div className="selector-panel">
    <div className="selector-panel-header">Field Wells</div>

    <DropBucket id="rows"    title="Rows"    icon="⇥" items={rows}    onRemove={removeRow}    />
    <DropBucket id="columns" title="Columns" icon="⇄" items={columns} onRemove={removeColumn} />
    <DropBucket id="values"  title="Values"  icon="Σ" items={values}  onRemove={removeValue}  />

    <div className="agg-bucket">
      <div className="drop-bucket-header">
        <span className="drop-bucket-icon">ƒ</span>
        <strong className="drop-bucket-title">Summarize by</strong>
      </div>
      <div className="agg-select-wrap">
        <select
          className="agg-select"
          value={aggType}
          onChange={(e) => setAggType(e.target.value as AggType)}
        >
          {AGG_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  </div>
);