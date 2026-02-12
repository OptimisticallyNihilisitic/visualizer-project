import { useDroppable } from "@dnd-kit/core";

function DropBucket({
  id,
  title,
  items,
  onRemove,
}: {
  id: string;
  title: string;
  items: string[];
  onRemove: (item: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        border: "1px dashed #aaa",
        padding: "10px",
        marginBottom: "15px",
        background: isOver ? "#e3f2fd" : "white",
        minHeight: "40px",
      }}
    >
      <strong>{title}</strong>

      {items.map((item) => (
        <div
          key={item}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center", 
            marginTop: "0px",
            background: "#f5f5f5",
            padding: "0px 6px",
            borderRadius: "4px",
          }}
        >
          <span 
            style={{whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "200px"}
            }
            title={item}
          >
            {item}
          </span>
          <button
            onClick={() => onRemove(item)}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "red",
              fontWeight: "",
            }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
 

export const SelectorPanel = ({
  rows,
  columns,
  values,
  removeRow,
  removeColumn,
  removeValue,
}: {
  rows: string[];
  columns: string[];
  values: string[];
  removeRow: (item: string) => void;
  removeColumn: (item: string) => void;
  removeValue: (item: string) => void;
}) => {
  return (
    <div className="sidebar">
      <DropBucket id="rows" title="Rows" items={rows} onRemove={removeRow} />
      <DropBucket id="columns" title="Columns" items={columns} onRemove={removeColumn} />
      <DropBucket id="values" title="Values" items={values} onRemove={removeValue} />
    </div>
  );
};

