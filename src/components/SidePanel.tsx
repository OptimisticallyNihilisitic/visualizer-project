import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

function DraggableField({ name }: { name: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: name,
    data: { field: name },
  });
 
  const style = {
    transform: CSS.Translate.toString(transform),
    padding: "2px",
    marginBottom: "6px",
    background: "#ffffff",
    color: "black",
    borderRadius: "4px",
    fontSize: "14px",
    cursor: "grab",

    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "200px",

    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} title={name} style={style} {...listeners} {...attributes}>
      {name}
    </div>
  );
}

export const SidePanel: React.FC<{ columns: string[] }> = ({ columns }) => {
  return (
    <div className="sidebar">
      <h4>Columns</h4>
      {columns.map((col) => (
        <DraggableField key={col} name={col} />
      ))}
    </div>
  );
};
