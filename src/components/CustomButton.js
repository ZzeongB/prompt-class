import React from "react";

const sizeStyles = {
  sm: {
    padding: "6px 12px",
    fontSize: "12px",
    borderRadius: "6px",
  },
  md: {
    padding: "8px 16px",
    fontSize: "13px",
    borderRadius: "8px",
  },
  lg: {
    padding: "8px 18px",
    fontSize: "15px",
    borderRadius: "12px",
  },
};

const colorStyles = {
  object: {
    background: "linear-gradient(180deg, #f8b5a5 0%, #f8a9a0 100%)",
    color: "#1a1a1a",
  },
  group: {
    background: "linear-gradient(180deg, #ffe9eb 0%, #fbdada 100%)",
    color: "#1a1a1a",
  },
  // 기존 유지
  purpleBlue: {
    background: "linear-gradient(135deg, #9A90FF, #63B4FF)",
    color: "#fff",
  },
  neutral: {
    background: "#f5f5f5",
    color: "#1a1a1a",
  },
  grey: {
    background: "linear-gradient(180deg, #e0e0e0 0%, #cfcfcf 100%)",
    color: "#1a1a1a",
  },
  // ...
};

export default function CustomButton({
  children,
  onClick,
  color = "purpleBlue",
  size = "md",
  style = {},
  disabled = false,
}) {
  const sizeStyle = sizeStyles[size] || sizeStyles.md;
  const baseColors = disabled
    ? colorStyles["neutral"]
    : colorStyles[color] || colorStyles.purpleBlue;

  return (
    <button
      onClick={onClick}
      onMouseDown={(e) => e.stopPropagation()}
      disabled={disabled}
      style={{
        ...sizeStyle,
        ...baseColors,
        fontWeight: "bold",
        border: "none",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        cursor: "pointer",
        transition: "all 0.2s ease-in-out",
        margin: "5px",
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
