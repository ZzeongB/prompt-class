import React, { memo } from "react";
import { NodeResizer, Handle, Position, useConnection } from "@xyflow/react";
import { OBJ_COLOR, ATTR_COLOR, REL_COLOR } from "../../utils/constants";

function ResizableNode({ id, data, nodeType, style }) {
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;
  const showHandle = connection.inProgress && isTarget;

  const handleMouseDown = (e) => {
    e.stopPropagation(); // ✅ prevents parent from hijacking the drag
    e.preventDefault(); // ✅ optional but helps prevent text selection, etc.
  };
  return (
    <div>
      <NodeResizer
        color={
          data.type === "object" || data.type === "object-group"
            ? OBJ_COLOR
            : data.type === "attribute" || data.type === "attribute-group"
            ? ATTR_COLOR
            : REL_COLOR
        }
        minWidth={30}
        minHeight={30}
      />
      {!connection.inProgress && (
        <Handle
          className="classHandle"
          position={Position.Right}
          type="source"
          onMouseDown={handleMouseDown}
          style={{ top: "50%", transform: "translateY(-50%)", right: "-8px" }}
        />
      )}
      {(!connection.inProgress || isTarget) && (
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

      {(!connection.inProgress || isTarget) && (
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
      )}

      <div style={{ visibility: "hidden", height: "1em" }}>
        {data.label}
      </div>
    </div>
  );
}

export default memo(ResizableNode);
