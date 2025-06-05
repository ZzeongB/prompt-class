import { useReactFlow, NodeResizer, NodeResizeControl } from "@xyflow/react";
import {
  OBJ_COLOR_TRANS,
  REL_COLOR_TRANS,
  ATTR_COLOR_TRANS,
} from "../utils/constants";
import { useDnD } from "../context/DragAndDropContext";
import { useState } from "react";

const controlStyle = {
  background: "transparent",
  border: "none",
};

export default function GroupNode({
  id,
  data,
  onToggleCollapse,
  dragSourceType,
  forceType = null,
  withBackground = false,
  resizable = false,
}) {
  const [, setId, , setType, , setPosition, , setLabel, , setDragSource] =
    useDnD();

  const [handlePos, setHandlePos] = useState("");

  const { setNodes } = useReactFlow();

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

  const onResize = (event, { width, height }) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;

        const newWidth = Number.isFinite(width) ? width : 200;
        const newHeight = Number.isFinite(height) ? height : 200;
        const prevWidth = n.style?.width ?? n.data?.expandedWidth ?? 200;
        const prevHeight = n.style?.height ?? n.data?.expandedHeight ?? 200;

        // 기본값: position 그대로
        let newPosition = { ...n.position };

        // ⬅️ 왼쪽 리사이즈면 x 위치 이동
        if (handlePos?.includes("left")) {
          const deltaX = prevWidth - newWidth;
          newPosition.x = n.position.x + deltaX;
        }

        // ⬆️ 위쪽 리사이즈면 y 위치 이동
        if (handlePos?.includes("top")) {
          const deltaY = prevHeight - newHeight;
          newPosition.y = n.position.y + deltaY;
        }

        return {
          ...n,
          position: newPosition,
          data: {
            ...n.data,
            expandedHeight: newHeight,
            expandedWidth: newWidth,
          },
          style: {
            ...n.style,
            height: newHeight,
            width: newWidth, // ✅ 이걸 꼭 넣어야 React Flow가 외부 style로 렌더
          },
        };
      })
    );
  };

  const color =
    data.type === "object"
      ? OBJ_COLOR_TRANS
      : data.type === "relationship"
      ? REL_COLOR_TRANS
      : ATTR_COLOR_TRANS;

  return (
    <div style={{ position: "relative" }}>
      {resizable ? (
        <NodeResizeControl
          style={controlStyle}
          minWidth={100}
          minHeight={50}
          onResize={onResize}
        >
          <ResizeIcon />
        </NodeResizeControl>
      ) : (
        <></>
      )}
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
        onClick={() => {
          onToggleCollapse(id);
        }}
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

function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="#ff0071"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: "absolute", right: 5, bottom: 5 }}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="16 20 20 20 20 16" />
      <line x1="14" y1="14" x2="20" y2="20" />
      <polyline points="8 4 4 4 4 8" />
      <line x1="4" y1="4" x2="10" y2="10" />
    </svg>
  );
}
