import { useState } from "react";

const sizeStyles = {
  sm: { padding: "6px 12px", fontSize: "11px", borderRadius: "6px" },
  md: { padding: "8px 16px", fontSize: "13px", borderRadius: "8px" },
  lg: { padding: "8px 18px", fontSize: "15px", borderRadius: "12px" },
};

const colorStyles = {
  object: {
    backgroundColor: "#f8b5a5",
    color: "#1a1a1a",
    borderColor: "#f29c85",
    shadowColor: "rgba(248, 181, 165, 0.15)",
  },
  group: {
    backgroundColor: "#ffe9eb",
    color: "#1a1a1a", 
    borderColor: "#fdc2c8",
    shadowColor: "rgba(255, 233, 235, 0.15)",
  },
  purpleBlue: {
    backgroundColor: "#9A90FF",
    color: "#fff",
    borderColor: "#7c6df7",
    shadowColor: "rgba(154, 144, 255, 0.15)",
  },
  neutral: {
    backgroundColor: "#f5f5f5",
    color: "#1a1a1a",
    borderColor: "#e0e0e0",
    shadowColor: "rgba(0, 0, 0, 0.05)",
  },
  grey: {
    backgroundColor: "#e0e0e0",
    color: "#1a1a1a",
    borderColor: "#c0c0c0",
    shadowColor: "rgba(0, 0, 0, 0.05)",
  },
  green: {
    backgroundColor: "#c8e6c9",
    color: "#1a1a1a",
    borderColor: "#a5d6a7",
    shadowColor: "rgba(200, 230, 201, 0.15)",
  },
};

export default function CustomButton({
  children,
  onClick,
  color = "purpleBlue",
  size = "md",
  style = {},
  disabled = false,
  tooltip = "",
}) {
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const baseColors = disabled
    ? colorStyles["grey"]
    : colorStyles[color] || colorStyles.purpleBlue;

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };
  const handleMouseDown = (e) => {
    e.stopPropagation();
    setIsPressed(true);
  };
  const handleMouseUp = () => setIsPressed(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={onClick}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        disabled={disabled}
        style={{
          ...sizeStyle,
          backgroundColor: baseColors.backgroundColor,
          color: disabled ? "#9ca3af" : baseColors.color,
          border: `1px solid ${baseColors.borderColor}`,
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: "bold",
          transition: "all 0.2s ease-in-out",
          boxShadow: isPressed 
            ? `0 1px 2px ${baseColors.shadowColor}` 
            : isHovered 
              ? `0 3px 8px ${baseColors.shadowColor}` 
              : `0 2px 4px ${baseColors.shadowColor}`,
          transform: isPressed 
            ? "translateY(1px)" 
            : isHovered 
              ? "translateY(-2px)" 
              : "translateY(0)",
          opacity: disabled ? 0.6 : 1,
          margin: "5px",
          ...style,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </button>

      {tooltip && isHovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: "500",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 10000,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(10px)",
            animation: "tooltipFadeIn 0.2s ease-out",
          }}
        >
          {tooltip}
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid rgba(0, 0, 0, 0.9)",
              width: 0,
              height: 0,
            }}
          />
        </div>
      )}
    </div>
  );
}
