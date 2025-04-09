import React from "react";
import { useDnD } from "../context/DragAndDropContext";
const GhostNode = () => {
  const [id, , type, , position, , label, ] = useDnD();

  if (!type) return null;

  return (
    <div
      style={{
        pointerEvents: 'none', // ✅ 이거 없으면 onDrop 안 먹힘

        position: "fixed",
        top: position.y,
        left: position.x,
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        opacity: 0.5,
        zIndex: 9999,
        border: "2px solid #333",
        borderRadius: 8,
        padding: 8,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: type === "attribute" ? "#4DABF7" : type === "object" ? "#FF6B6B" : type === "relation" ? "#51CF66" : "#D6D6FF",
        fontSize: "12px",
      }}
    >
      {label}
    </div>
  );
};

export default GhostNode;
