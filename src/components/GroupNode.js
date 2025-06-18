import {
  useReactFlow,
  Position,
  NodeResizeControl,
  NodeToolbar,
  Handle,
  useConnection,
} from "@xyflow/react";
import {
  OBJ_COLOR_TRANS,
  REL_COLOR_TRANS,
  ATTR_COLOR_TRANS,
} from "../utils/constants";
import { useDnD } from "../context/DragAndDropContext";
import { useState } from "react";
import HoverButton from "./HoverButton";
import {
  duplicateNodesWithMapping,
  duplicateEdges,
} from "../utils/node/duplicateUtils";

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
  const label = data.hasValue ? data.hasValue : data.label;
  const [, setId, , setType, , setPosition, , setLabel, , setDragSource] =
    useDnD();
  const [handlePos, setHandlePos] = useState("");
  const { setNodes, getNodes, getEdges, setEdges } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [isHovered, setIsHovered] = useState(false);
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

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

  const handleLabelUpdate = () => {
    setNodes((prevNodes) =>
      prevNodes.map((node) =>
        node.id === id
          ? {
              ...node,
              // id: `class-${editLabel}`,
              data: { ...node.data, label: editLabel, hasValue: editLabel },
            }
          : node
      )
    );
    setIsEditing(false);
  };

  const handleDelete = () => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== id));
  };

  const handleDuplicateNode = () => {
    const allNodes = getNodes();
    const allEdges = getEdges();

    const groupNode = allNodes.find((n) => n.id === id);
    const children = allNodes.filter((n) => n.parentNode === id);

    const { duplicated, idMap, randomId } = duplicateNodesWithMapping(
      [groupNode, ...children],
      {
        offset: { x: 0, y: 350 },
      }
    );

    const duplicatedRelatedEdges = duplicateEdges(allEdges, idMap, randomId);

    setNodes((prev) => [...prev, ...duplicated]);
    setEdges((prev) => [...prev, ...duplicatedRelatedEdges]);
  };

  return (
    <div
      style={{ position: "relative", pointerEvents: "auto" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeToolbar
        isVisible={isHovered || isEditing}
        position={Position.Top}
        style={{ top: "25px", left: "-20px", display: "flex", gap: "2px" }}
      >
        {/* ✏️ or 💾 */}
        <HoverButton
          title={isEditing ? "Save label" : "Edit label"}
          icon={isEditing ? "💾" : "✏️"}
          onClick={isEditing ? handleLabelUpdate : () => setIsEditing(true)}
        />
        <HoverButton
          title="Duplicate node"
          icon="📄"
          onClick={handleDuplicateNode}
        />
        {/* 🗑 Delete */}
        <HoverButton
          title="Delete node"
          icon="🗑"
          onClick={handleDelete}
          danger
        />
      </NodeToolbar>
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
        {isEditing ? (
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            style={{ width: "90%", fontSize: "14px" }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <strong>{data.label}</strong> {data.collapsed ? "▶" : "▼"}
          </>
        )}
      </div>
      {!connection.inProgress && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="source"
          style={{ top: "15px", transform: "translateY(-50%)", right: "-8px" }}
        />
      )}
      {(!connection.inProgress || isTarget) && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="target"
          isConnectableStart={false}
          style={{ top: "15px", transform: "translateY(-50%)", right: "-8px" }}
        />
      )}
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
