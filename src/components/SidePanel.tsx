import { useDraggableField } from "../hooks/useDraggableField";

function DraggableField({ name }: { name: string }) {
  const { attributes, listeners, setNodeRef, style } =
    useDraggableField(name);

  return (
    <div
      ref={setNodeRef}
      style={style}
      title={name}
      className="draggable-field"
      {...listeners}
      {...attributes}
    >
      <span className="drag-handle">⠿</span>
      <span className="field-label">{name}</span>
    </div>
  );
}

export const SidePanel: React.FC<{ columns: string[] }> = ({ columns }) => (
  <div className="side-panel">
    <div className="side-panel-header">
      <span className="side-panel-title">Fields</span>
    </div>
    <div className="side-panel-fields">
      {columns.length === 0 ? (
        <div className="side-panel-empty">Upload a file to see fields</div>
      ) : (
        columns.map((col) => <DraggableField key={col} name={col} />)
      )}
    </div>
  </div>
);