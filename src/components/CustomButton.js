import React from "react";

const sizeStyles = {
  sm: {
    padding: "6px 12px",
    fontSize: "12px",
  },
  md: {
    padding: "8px 16px",
    fontSize: "14px",
  },
  lg: {
    padding: "8px 18px",
    fontSize: "15px",
  },
};
const colorStyles = {
  purpleBlue: {
    background: "linear-gradient(135deg, #9A90FF, #63B4FF)",
    color: "#fff",
  },
  salmonGray: {
    background: "#f5d6cc",
    color: "#1a1a1a",
  },
  skyGray: {
    background: "#d5e8f9",
    color: "#1a1a1a",
  },
  mintGray: {
    background: "#d0f5e6",
    color: "#1a1a1a",
  },
  neutral: {
    background: "#f5f5f5",
    color: "#1a1a1a",
  },
};

export default function CustomButton({
  children,
  onClick,
  color = "purpleBlue",
  size = "md",
  style = {},
}) {
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const baseColors = colorStyles[color] || colorStyles.purpleBlue;

  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        ...sizeStyle,
        ...baseColors,
        fontWeight: "bold",
        border: "none",
        borderRadius: "12px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}
