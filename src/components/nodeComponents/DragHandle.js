// components/DragHandle.tsx
import { GripVertical } from "lucide-react";

export default function DragHandle({
  position = { top: "15px", left: "-10px" },
  isVisible = false,
}) {
  return (
    isVisible &&
    <div
      className="drag-handle"
      style={{
        cursor: "move",
        position: "absolute",
        width: "20px",
        height: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "0 3px 0 3px",
        zIndex: 10,
        ...position,
      }}
    >
      <GripVertical size={16} />
    </div>
  );
}
