import React, { useState } from "react";
import { toolbarButtonStyle, hoverStyle } from "../utils/node/toolbarStyles";

function HoverButton({ title, icon, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    ...toolbarButtonStyle,
    ...(hovered ? hoverStyle : {}),
    ...(danger && {
      //   border: "1px solid #C62828",
      backgroundColor: hovered
        ? "rgba(255, 200, 200, 0.95)"
        : "rgba(255, 235, 235, 0.85)",
      color: "#C62828",
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
