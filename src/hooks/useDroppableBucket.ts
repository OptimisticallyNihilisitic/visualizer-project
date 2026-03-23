import { useDroppable } from "@dnd-kit/core";

export function useDroppableBucket(id: string) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const className = `drop-bucket${isOver ? " drop-bucket--over" : ""}`;

  return {
    setNodeRef,
    className,
  };
}