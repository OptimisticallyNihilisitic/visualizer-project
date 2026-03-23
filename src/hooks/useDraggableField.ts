import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export function useDraggableField(name: string) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: name,
      data: { field: name },
    });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  };

  return {
    attributes,
    listeners,
    setNodeRef,
    style,
  };
}