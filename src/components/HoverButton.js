import React, { useState } from "react";
import { toolbarButtonStyle, hoverStyle } from "../utils/node/toolbarStyles";

function HoverButton({ title, icon, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    fontSize: "16px",
    padding: "6px 8px",
    backgroundColor: hovered ? "rgba(255,255,255,0.1)" : "transparent",
    color: "#FFFFFF",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    ...(danger && {
      color: "#FF6B6B",
      backgroundColor: hovered ? "rgba(255,107,107,0.15)" : "transparent",
    }),
  };

  return (
    <button
      title={title}
      style={baseStyle}
      onClick={(e) => {
        e.stopPropagation(); // ✅ 여기
        onClick?.();
      }}
      onMouseDown={(e) => e.stopPropagation()} // ✅ 여기도 추가해주면 안정적
      onMouseEnter={(e) => {
        setHovered(true);
      }}
      onMouseLeave={(e) => {
        setHovered(false);
      }}
    >
      {icon}
    </button>
  );
}

export default HoverButton;
