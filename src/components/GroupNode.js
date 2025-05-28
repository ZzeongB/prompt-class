import { useReactFlow } from "@xyflow/react";
import {
  OBJ_COLOR_TRANS,
  REL_COLOR_TRANS,
  ATTR_COLOR_TRANS,
} from "../utils/constants";
import { useDnD } from "../context/DragAndDropContext";

export default function GroupNode({
  id,
  data,
  onToggleCollapse,
  dragSourceType,
  forceType = null,
  withBackground = false,
}) {
  const [, setId, , setType, , setPosition, , setLabel, , setDragSource] =
    useDnD();

  const onDragStart = (e) => {
    if (e.target.closest(".classHandle")) return;

    setType(forceType ?? data.type); // 강제 타입 설정이 있으면 사용
    setLabel(data.label);
    setId(id);
    setDragSource(dragSourceType);

    const onMouseMove = (e) => setPosition({ x: e.clientX, y: e.clientY });

    const onMouseUp = () => {
      setType(null);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const color =
    data.type === "object"
      ? OBJ_COLOR_TRANS
      : data.type === "relationship"
      ? REL_COLOR_TRANS
      : ATTR_COLOR_TRANS;

  return (
    <div style={{ position: "relative" }}>
      <div
        className="drag-handle"
        style={{
          cursor: "move",
          position: "absolute",
          top: "15px",
          left: "-10px",
          width: "20px",
          height: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "0 3px 0 3px",
          zIndex: 10,
        }}
      >
        ⠿
      </div>
      <div
        onClick={() => onToggleCollapse(id)}
        onMouseDown={onDragStart}
        className="nodrag"
        style={{
          padding: 10,
          border: "5px solid",
          borderColor: color,
          borderRadius: 12,
          height: data.collapsed ? 25 : data.expandedHeight ?? 200,
          ...(withBackground ? { background: color } : {}),
        }}
      >
        <strong>{data.label}</strong> {data.collapsed ? "▶" : "▼"}
      </div>
    </div>
  );
}
