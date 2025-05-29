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
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {icon}
    </button>
  );
}

export default HoverButton;