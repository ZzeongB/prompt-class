// components/NodeHandles.tsx
import React from "react";
import { Handle, Position, useConnection } from "@xyflow/react";

const getHandleStyle = (pos) => {
  const base = {
    width: "3px",
    height: "3px",
    background: "#777",
    borderRadius: "50%",
    position: "absolute",
    zIndex: 1,
  };

  switch (pos) {
    case "Top":
      return { ...base, top: -10, left: "50%", transform: "translateX(-50%)" };
    case "Bottom":
      return {
        ...base,
        bottom: -10,
        left: "50%",
        transform: "translateX(-50%)",
      };
    case "Left":
      return { ...base, left: -10, top: "50%", transform: "translateY(-50%)" };
    case "Right":
      return { ...base, right: -10, top: "50%", transform: "translateY(-50%)" };
    default:
      return base;
  }
};

export default function NodeHandles({ id, isSelected, nodeType }) {
  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode?.id !== id;
  const sourceType = connection.fromNode?.data?.type;

  const showTargetHandle =
    !connection.inProgress ||
    (isTarget && sourceType === nodeType) ||
    (sourceType == "object" && nodeType == "attribute");
  return (
    <>
      {["Right", "Bottom", "Top"].map((pos) => (
        <React.Fragment key={pos}>
          {!connection.inProgress && (
            <Handle
              type="source"
              position={Position[pos]}
              style={{
                ...getHandleStyle(pos),
                opacity: isSelected ? 1 : 0,
                pointerEvents: isSelected ? "auto" : "none",
                zIndex: 100,
              }}
            />
          )}

          {showTargetHandle && (
            <Handle
              type="target"
              position={Position[pos]}
              isConnectableStart={false}
              style={{
                ...getHandleStyle(pos),
                opacity: isTarget ? 1 : 0,
                pointerEvents: isTarget ? "auto" : "none",
              }}
            />
          )}
        </React.Fragment>
      ))}
    </>
  );
}
