import { useState } from "react";

function HoverButton({ title, icon, onClick, danger = false, style = {} }) {
  const [hovered, setHovered] = useState(false);

  const baseStyle = {
    ...style,
    fontSize: "16px",
    padding: "6px 8px",
    backgroundColor: hovered ? "rgba(255,255,255,0.1)" : "transparent",
    color: "#FFFFFF",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    position: "relative",
    ...(danger && {
      color: "#FF6B6B",
      backgroundColor: hovered ? "rgba(255,107,107,0.15)" : "transparent",
    }),
  };

  const tooltipStyle = {
    position: "absolute",
    bottom: "110%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0,0,0,0.75)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    whiteSpace: "nowrap",
    pointerEvents: "none",
    opacity: hovered ? 1 : 0,
    transition: "opacity 0.2s ease",
    zIndex: 1000,
  };

  return (
    <button
      style={baseStyle}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && title && <div style={tooltipStyle}>{title}</div>}
      {icon}
    </button>
  );
}

export default HoverButton;
