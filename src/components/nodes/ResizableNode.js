import React, { memo } from "react";
import { NodeResizer, Handle, Position, useConnection } from "@xyflow/react";
import {
  OBJ_COLOR,
  ATTR_COLOR,
  REL_COLOR,
  DARK_GREY_TRANS,
} from "../../utils/constants";
import { useReactFlow } from "@xyflow/react";
import { logEvent } from "../../api/logEvent"; // ✅ 로깅 함수 임포트

function ResizableNode({ id, data, nodeType, style }) {
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;
  const showHandle =
    connection.inProgress &&
    connection.fromNode?.type == "resizable" &&
    isTarget;
  const { setNodes, getNodes, getEdges } = useReactFlow();

  const handleMouseDown = (e) => {
    e.stopPropagation(); // ✅ prevents parent from hijacking the drag
    e.preventDefault(); // ✅ optional but helps prevent text selection, etc.
  };

  const handleResize = (resizedId, { width, height }) => {
    const nodes = getNodes();
    const edges = getEdges();
    const resizedNode = nodes.find((n) => n.id === resizedId);
    if (!resizedNode) return;

    const prevWidth =
      resizedNode.style?.width ?? resizedNode.data?.expandedWidth ?? 200;
    const prevHeight =
      resizedNode.style?.height ?? resizedNode.data?.expandedHeight ?? 200;

    const delta = {
      width: width - prevWidth,
      height: height - prevHeight,
    };

    const linkedSizeNodeIds = edges
      .filter(
        (e) =>
          e.label === "size" &&
          (e.source === resizedId || e.target === resizedId)
      )
      .map((e) => (e.source === resizedId ? e.target : e.source));

    // ✅ 로깅 추가
    logEvent("layoutboard.node.resizable.resized", {
      nodeId: resizedId,
      prevSize: { width: prevWidth, height: prevHeight },
      newSize: { width, height },
      delta,
      linkedSizeNodeIds,
    });

    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === resizedId || linkedSizeNodeIds.includes(n.id)) {
          const newWidth =
            (n.style?.width ?? n.data?.expandedWidth ?? 200) + delta.width;
          const newHeight =
            (n.style?.height ?? n.data?.expandedHeight ?? 200) + delta.height;

          return {
            ...n,
            width: newWidth,
            height: newHeight,
          };
        }
        return n;
      })
    );
  };

  return (
    <div
      style={{
        borderRadius: "4px",
        transition: "all 0.15s ease",
        zIndex: 0, // Always render below SimpleLayoutNode
      }}
    >
      <NodeResizer
        color={DARK_GREY_TRANS}
        minWidth={20}
        minHeight={20}
        onResizeEnd={(e, params) => handleResize(id, params)}
      />
      {/* {!data.baseline && !connection.inProgress && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="source"
          onMouseDown={handleMouseDown}
          style={{ top: "50%", transform: "translateY(-50%)", right: "-8px" }}
        />
      )} */}
      {/* {!data.baseline && (!connection.inProgress || isTarget) && (
        <>
          <Handle
            id="size"
            type="target"
            position={Position.Right}
            isConnectableStart={false}
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              top: "35%",
              right: "-10px",
              transform: "translateY(-50%)",
              background: ATTR_COLOR,
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              pointerEvents: showHandle ? "auto" : "none", // ✅ 드래깅 아닐 땐 무시
              opacity: showHandle ? 1 : 0, // ✅ 안 보이게
              zIndex: 5,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "35%",
              right: "-40px",
              transform: "translateY(-50%)",
              fontSize: "10px",
              color: ATTR_COLOR,
              whiteSpace: "nowrap",
              opacity: showHandle ? 1 : 0, // ✅ 안 보이게
            }}
          >
            size
          </span>
        </>
      )}

      {!data.baseline && (!connection.inProgress || isTarget) && (
        <>
          <Handle
            id="position"
            type="target"
            position={Position.Right}
            isConnectableStart={false}
            onMouseDown={handleMouseDown}
            style={{
              position: "absolute",
              top: "65%",
              right: "-10px",
              transform: "translateY(-50%)",
              background: ATTR_COLOR,
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              pointerEvents: showHandle ? "auto" : "none", // ✅ 드래깅 아닐 땐 무시
              opacity: showHandle ? 1 : 0, // ✅ 안 보이게
              zIndex: 5,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "65%",
              right: "-60px",
              transform: "translateY(-50%)",
              fontSize: "10px",
              color: ATTR_COLOR,
              whiteSpace: "nowrap",
              opacity: showHandle ? 1 : 0, // ✅ 안 보이게
            }}
          >
            position
          </span>
        </>
      )} */}

      <div style={{ visibility: "hidden", height: "1em" }}>{data.label}</div>
    </div>
  );
}

export default memo(ResizableNode, (prevProps, nextProps) => {
  // Compare relevant props for re-rendering
  const isDifferent = 
    prevProps.data.label !== nextProps.data.label ||
    prevProps.style !== nextProps.style;
  
  // Return false to re-render, true to skip
  return !isDifferent;
});
