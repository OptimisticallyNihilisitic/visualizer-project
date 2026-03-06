import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

function DraggableField({ name }: { name: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: name, data: { field: name } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0 : 1 }}
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