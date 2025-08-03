import React from "react";
import { UI_CONFIG } from "../../utils/layoutConstants";

const GhostNode = ({ ghostNode }) => {
  if (!ghostNode) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: ghostNode.position.x,
        top: ghostNode.position.y,
        padding: "8px 12px",
        border: "1px solid #d1d5db",
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        opacity: UI_CONFIG.GHOST_NODE_OPACITY,
        pointerEvents: "none",
        zIndex: 999,
        fontSize: "12px",
        fontWeight: "500",
      }}
    >
      {ghostNode.data?.label}
    </div>
  );
};

export default GhostNode;